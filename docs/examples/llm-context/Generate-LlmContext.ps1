param(
    [string]$SettingsFile = "",
    [string]$SettingsSection = "LlmContextBuild"
)

$ErrorActionPreference = "Stop"

function Get-SolutionRoot {
    param([string]$StartDir)

    $current = Get-Item (Resolve-Path $StartDir)

    while ($null -ne $current) {
        $sln = Get-ChildItem -Path $current.FullName -Filter *.sln -File -ErrorAction SilentlyContinue
        if ($sln.Count -gt 0) {
            return $current.FullName
        }

        if ($null -eq $current.Parent) { break }
        $current = $current.Parent
    }

    throw "Could not locate a .sln file by walking upward from '$StartDir'."
}

function Get-RelativePathSafe {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $baseUri = [System.Uri]((Resolve-Path $BasePath).Path.TrimEnd('\') + '\')
    $targetUri = [System.Uri]((Resolve-Path $TargetPath).Path)
    return [System.Uri]::UnescapeDataString(
        $baseUri.MakeRelativeUri($targetUri).ToString().Replace('/', '\')
    )
}

function Get-Sha256Hex {
    param([string]$Path)
    return (Get-FileHash -Path $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Read-PatternFile {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return @()
    }

    return Get-Content -Path $Path |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -and -not $_.StartsWith("#") }
}

function Ensure-ControlFiles {
    param([string]$Root)

    $ignorePath = Join-Path $Root ".llmignore"
    $whitelistPath = Join-Path $Root ".llmwhitelist"

    if (-not (Test-Path $ignorePath)) {
@"
# Ignore patterns
# Directory patterns should end with /
# Examples:
# bin/
# obj/
# node_modules/
# dist/
# .git/
# *.png
# *.jpg
# *.dll
# *.exe
# package-lock.json

bin/
obj/
node_modules/
dist/
build/
coverage/
.vs/
.git/
TestResults/
llm-context/

*.dll
*.exe
*.pdb
*.cache
*.log
*.png
*.jpg
*.jpeg
*.gif
*.webp
*.svg
*.ico
*.pdf
*.zip
*.map
*.min.js
*.min.css
package-lock.json
yarn.lock
pnpm-lock.yaml
"@ | Set-Content -Path $ignorePath -Encoding UTF8
    }

    if (-not (Test-Path $whitelistPath)) {
@"
# Whitelist patterns
# Files must match this file to be considered for inclusion.
# Examples:
# *.cs
# *.csproj
# *.sln
# *.sql
# README.md
# Dockerfile
# src/MyApp.Web/Program.cs

*.sln
*.csproj
*.props
*.targets
*.cs
*.razor
*.cshtml
*.json
*.config
*.xml
*.sql
*.js
*.jsx
*.ts
*.tsx
*.css
*.scss
*.html
*.md
*.txt
*.yml
*.yaml
*.ps1
*.sh

README.md
Dockerfile
docker-compose.yml
docker-compose.override.yml
"@ | Set-Content -Path $whitelistPath -Encoding UTF8
    }

    return [PSCustomObject]@{
        IgnorePath = $ignorePath
        WhitelistPath = $whitelistPath
    }
}

function Normalize-Pattern {
    param([string]$Pattern)
    return $Pattern.Trim().Replace('/', '\')
}

function Test-PatternMatch {
    param(
        [string]$RelativePath,
        [string[]]$Patterns
    )

    $rel = $RelativePath.Replace('/', '\')
    $leaf = Split-Path $rel -Leaf

    foreach ($rawPattern in $Patterns) {
        $pattern = Normalize-Pattern $rawPattern

        if ([string]::IsNullOrWhiteSpace($pattern)) {
            continue
        }

        if ($pattern.EndsWith("\")) {
            $dirPattern = $pattern.TrimEnd('\')

            if ($rel -like "$dirPattern\*") { return $true }
            if ($rel -like "*\$dirPattern\*") { return $true }
            continue
        }

        if ($pattern.Contains("\")) {
            if ($rel -like $pattern) { return $true }
            if ($rel -like "*\$pattern") { return $true }
            continue
        }

        if ($leaf -like $pattern) { return $true }
        if ($rel -like $pattern) { return $true }
    }

    return $false
}

function Get-FileCategory {
    param(
        [string]$RelativePath,
        [string]$Name,
        [string]$Extension
    )

    $p = $RelativePath.ToLowerInvariant()

    if ($Extension -eq ".sln") { return 0 }
    if ($Extension -eq ".csproj") { return 1 }

    if ($Name -match '^(Program\.cs|Startup\.cs|appsettings(\..+)?\.json|launchSettings\.json|Dockerfile|docker-compose.*|README(\..*)?)$') {
        return 2
    }

    if ($p -match '\\(interfaces|contracts)\\') { return 3 }
    if ($p -match '\\(models|entities|dtos|viewmodels)\\' -or $Name -match '(Dto|Model|Entity|ViewModel)\.cs$') { return 4 }
    if ($p -match '\\(services)\\' -or $Name -match '(Service|Manager|Provider|Handler)\.cs$') { return 5 }
    if ($p -match '\\(dal|data|repositories|repository|migrations)\\' -or $Extension -eq ".sql") { return 6 }
    if ($p -match '\\(controllers|pages)\\' -or $Extension -in @(".razor", ".cshtml")) { return 7 }
    if ($Extension -in @(".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".html")) { return 8 }

    return 9
}

function Get-PriorityScore {
    param(
        [string]$RelativePath,
        [string]$Name,
        [string]$Extension,
        [Int64]$Length
    )

    $category = Get-FileCategory -RelativePath $RelativePath -Name $Name -Extension $Extension
    $score = $category * 1000000

    if ($Name -match '^(Program\.cs|Startup\.cs|appsettings(\..+)?\.json|Dockerfile|docker-compose.*|README(\..*)?)$') {
        $score -= 500000
    }

    if ($RelativePath -match '\\(Interfaces|Contracts)\\') { $score -= 100000 }
    if ($RelativePath -match '\\(Controllers|Pages)\\') { $score -= 50000 }

    $score += [Math]::Min([int]($Length / 10), 99999)

    return $score
}

function Load-BuildSettings {
    param(
        [string]$Root,
        [string]$ExplicitSettingsFile,
        [string]$SectionName
    )

    $defaultSettings = [ordered]@{
        Enabled = $false
        SkipUnalteredFiles = $true
        OutputFolderName = "llm-context"
        MaxFileBytes = 250000
        SoftContextBytes = 6000000
        MergeIndexIntoContext = $false
        CleanOrphanedFragments = $true
        Verbose = $false
        GenerateCodeSummary = $true
        SummarizeFrontendFiles = $false
        MaxSummaryFileBytes = 200000
    }

    $settingsPath = $null

    if ($ExplicitSettingsFile) {
        $settingsPath = $ExplicitSettingsFile
    }
    else {
        $candidate1 = Join-Path $Root "appsettings.llmcontext.json"
        $candidate2 = Join-Path $Root "appsettings.json"

        if (Test-Path $candidate1) {
            $settingsPath = $candidate1
        }
        elseif (Test-Path $candidate2) {
            $settingsPath = $candidate2
        }
    }

    $settings = [ordered]@{}
    foreach ($k in $defaultSettings.Keys) {
        $settings[$k] = $defaultSettings[$k]
    }

    if (-not $settingsPath -or -not (Test-Path $settingsPath)) {
        return [PSCustomObject]@{
            Path = ""
            Values = [PSCustomObject]$settings
        }
    }

    $json = Get-Content -Path $settingsPath -Raw | ConvertFrom-Json -Depth 20

    $section = $null
    if ($json.PSObject.Properties.Name -contains $SectionName) {
        $section = $json.$SectionName
    }
    else {
        $section = $json
    }

    foreach ($prop in $section.PSObject.Properties) {
        $settings[$prop.Name] = $prop.Value
    }

    return [PSCustomObject]@{
        Path = $settingsPath
        Values = [PSCustomObject]$settings
    }
}

function Get-SettingsSignature {
    param($SettingsObject)
    return (($SettingsObject | ConvertTo-Json -Depth 20 -Compress))
}

function Get-FragmentFileName {
    param([string]$RelativePath)

    $safeBase = [System.IO.Path]::GetFileNameWithoutExtension($RelativePath)
    if ([string]::IsNullOrWhiteSpace($safeBase)) {
        $safeBase = "file"
    }

    $safeBase = ($safeBase -replace '[^a-zA-Z0-9\-_]', '_')
    $hashBytes = [System.Security.Cryptography.SHA1]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($RelativePath))
    $hash = [BitConverter]::ToString($hashBytes).Replace("-", "").ToLowerInvariant().Substring(0, 12)

    return "$safeBase`__$hash.fragment.txt"
}

function Get-SummaryFileName {
    param([string]$RelativePath)

    $safeBase = [System.IO.Path]::GetFileNameWithoutExtension($RelativePath)
    if ([string]::IsNullOrWhiteSpace($safeBase)) {
        $safeBase = "file"
    }

    $safeBase = ($safeBase -replace '[^a-zA-Z0-9\-_]', '_')
    $hashBytes = [System.Security.Cryptography.SHA1]::Create().ComputeHash(
        [System.Text.Encoding]::UTF8.GetBytes($RelativePath)
    )
    $hash = [BitConverter]::ToString($hashBytes).Replace("-", "").ToLowerInvariant().Substring(0, 12)

    return "$safeBase`__$hash.summary.json"
}

function Build-FragmentText {
    param(
        [System.IO.FileInfo]$File,
        [string]$RelativePath,
        [int]$Category,
        [bool]$Whitelisted,
        [int]$MaxFileBytes
    )

    $utf8 = [System.Text.Encoding]::UTF8
    $content = Get-Content -Path $File.FullName -Raw -ErrorAction Stop
    $originalBytes = $utf8.GetByteCount($content)

    $finalContent = $content
    $truncated = $false

    if ($originalBytes -gt $MaxFileBytes) {
        $truncated = $true

        $headChars = [Math]::Max([int]($content.Length * 0.70), 1)
        $tailChars = [Math]::Max([int]($content.Length * 0.20), 1)

        $head = $content.Substring(0, [Math]::Min($headChars, $content.Length))
        $tailStart = [Math]::Max($content.Length - $tailChars, 0)
        $tail = $content.Substring($tailStart)

        $notice = @"
[TRUNCATED FOR LLM SIZE OPTIMIZATION]
Original UTF8 bytes: $originalBytes
Per-file limit: $MaxFileBytes
Strategy: included beginning and ending sections.

--- BEGINNING SECTION ---
"@

        $candidate = $notice + "`r`n" + $head + "`r`n`r`n--- OMITTED MIDDLE SECTION ---`r`n`r`n--- ENDING SECTION ---`r`n" + $tail

        while ($utf8.GetByteCount($candidate) -gt $MaxFileBytes -and ($head.Length -gt 1000 -or $tail.Length -gt 500)) {
            if ($head.Length -gt 1000) {
                $head = $head.Substring(0, [Math]::Max([int]($head.Length * 0.9), 1000))
            }

            if ($tail.Length -gt 500) {
                $tail = $tail.Substring([Math]::Max([int]($tail.Length * 0.1), 0))
            }

            $candidate = $notice + "`r`n" + $head + "`r`n`r`n--- OMITTED MIDDLE SECTION ---`r`n`r`n--- ENDING SECTION ---`r`n" + $tail
        }

        $finalContent = $candidate
    }

    $header = @"
================================================================================
FILE: $RelativePath
CATEGORY: $Category
WHITELISTED: $Whitelisted
SIZE_BYTES: $($File.Length)
LAST_WRITE_UTC: $($File.LastWriteTimeUtc.ToString('s'))
================================================================================

"@

    $block = $header + $finalContent + "`r`n`r`n"

    return [PSCustomObject]@{
        BlockText = $block
        OriginalBytes = $originalBytes
        EmittedBytes = $utf8.GetByteCount($block)
        Truncated = $truncated
    }
}

function Save-TextIfChanged {
    param(
        [string]$Path,
        [string]$Content
    )

    if (Test-Path $Path) {
        $existing = Get-Content -Path $Path -Raw
        if ($existing -ceq $Content) {
            return $false
        }
    }

    $parent = Split-Path $Path -Parent
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent | Out-Null
    }

    $Content | Set-Content -Path $Path -Encoding UTF8
    return $true
}

function Load-Manifest {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return @{
            Version = 1
            SettingsSignature = ""
            Files = @{}
            EmittedOrder = @()
            IncludedOrder = @()
        }
    }

    $raw = Get-Content -Path $Path -Raw | ConvertFrom-Json -Depth 50
    $fileMap = @{}

    if ($raw.Files) {
        foreach ($p in $raw.Files.PSObject.Properties) {
            $fileMap[$p.Name] = $p.Value
        }
    }

    return @{
        Version = $raw.Version
        SettingsSignature = $raw.SettingsSignature
        Files = $fileMap
        EmittedOrder = @($raw.EmittedOrder)
        IncludedOrder = @($raw.IncludedOrder)
    }
}

function Save-Manifest {
    param(
        [string]$Path,
        [hashtable]$Manifest
    )

    $filesOrdered = [ordered]@{}
    foreach ($key in ($Manifest.Files.Keys | Sort-Object)) {
        $filesOrdered[$key] = $Manifest.Files[$key]
    }

    $obj = [ordered]@{
        Version = $Manifest.Version
        SettingsSignature = $Manifest.SettingsSignature
        EmittedOrder = @($Manifest.EmittedOrder)
        IncludedOrder = @($Manifest.IncludedOrder)
        Files = $filesOrdered
    }

    ($obj | ConvertTo-Json -Depth 50) | Set-Content -Path $Path -Encoding UTF8
}

function Should-SummarizeFile {
    param(
        [object]$Record,
        $SettingsValues
    )

    if (-not $SettingsValues.GenerateCodeSummary) {
        return $false
    }

    if ($Record.Length -gt [int64]$SettingsValues.MaxSummaryFileBytes) {
        return $false
    }

    switch ($Record.Extension) {
        ".cs"       { return $true }
        ".cshtml"   { return $true }
        ".razor"    { return $true }
        ".js"       { return [bool]$SettingsValues.SummarizeFrontendFiles }
        ".ts"       { return [bool]$SettingsValues.SummarizeFrontendFiles }
        ".tsx"      { return [bool]$SettingsValues.SummarizeFrontendFiles }
        default     { return $false }
    }
}

function Get-CSharpFileSummary {
    param(
        [string]$Path,
        [string]$RelativePath
    )

    $text = Get-Content -Path $Path -Raw -ErrorAction Stop

    $namespace = ""
    $className = ""
    $baseTypes = @()
    $publicMethods = @()
    $pageHandlers = @()
    $isPageModel = $false
    $isDalLike = $false
    $sqlOps = New-Object System.Collections.Generic.HashSet[string]

    $nsMatch = [regex]::Match($text, '(?m)^\s*namespace\s+([A-Za-z0-9_.]+)')
    if ($nsMatch.Success) {
        $namespace = $nsMatch.Groups[1].Value
    }

    $classMatch = [regex]::Match($text, '(?m)^\s*public\s+(?:partial\s+)?class\s+([A-Za-z0-9_]+)(?:\s*:\s*([^{\r\n]+))?')
    if ($classMatch.Success) {
        $className = $classMatch.Groups[1].Value
        if ($classMatch.Groups[2].Success) {
            $baseTypes = $classMatch.Groups[2].Value.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
        }
    }

    if ($baseTypes -contains "PageModel" -or $text -match '\bPageModel\b') {
        $isPageModel = $true
    }

    if ($RelativePath -match '\\(DAL|Data|Repositories|Repository)\\' -or
        $className -match '(Dal|Repository|DataAccess)$') {
        $isDalLike = $true
    }

    $methodMatches = [regex]::Matches(
        $text,
        '(?m)^\s*public\s+(?:async\s+)?(?:[A-Za-z0-9_<>\[\],?.]+\s+)+([A-Za-z0-9_]+)\s*\('
    )

    foreach ($m in $methodMatches) {
        $name = $m.Groups[1].Value
        if ($name -and $publicMethods -notcontains $name) {
            $publicMethods += $name
        }

        if ($name -match '^On(Get|Post|Put|Delete|Patch)([A-Za-z0-9_]*)$') {
            $pageHandlers += $name
        }
    }

    if ($text -match '\bSELECT\b') { [void]$sqlOps.Add("SELECT") }
    if ($text -match '\bINSERT\b') { [void]$sqlOps.Add("INSERT") }
    if ($text -match '\bUPDATE\b') { [void]$sqlOps.Add("UPDATE") }
    if ($text -match '\bDELETE\b') { [void]$sqlOps.Add("DELETE") }
    if ($text -match '\bEXEC\b|\bExecuteReader\b|\bExecuteScalar\b|\bExecuteNonQuery\b') { [void]$sqlOps.Add("EXECUTE") }
    if ($text -match '\bSqlConnection\b|\bSqlCommand\b|\bDbConnection\b|\bDbCommand\b') { [void]$sqlOps.Add("ADO.NET") }
    if ($text -match '\bstored\s+procedure\b|\bCommandType\.StoredProcedure\b') { [void]$sqlOps.Add("StoredProcedure") }

    return [ordered]@{
        RelativePath = $RelativePath
        Kind = "csharp"
        Namespace = $namespace
        ClassName = $className
        BaseTypes = @($baseTypes)
        PublicMethods = @($publicMethods)
        PageHandlers = @($pageHandlers)
        IsPageModel = $isPageModel
        IsDalLike = $isDalLike
        SqlOps = @($sqlOps)
    }
}

function Get-CshtmlFileSummary {
    param(
        [string]$Path,
        [string]$RelativePath
    )

    $text = Get-Content -Path $Path -Raw -ErrorAction Stop

    $hasPageDirective = $false
    $routeTemplate = ""
    $modelType = ""

    $pageMatch = [regex]::Match($text, '(?m)^\s*@page(?:\s+"([^"]+)")?')
    if ($pageMatch.Success) {
        $hasPageDirective = $true
        if ($pageMatch.Groups[1].Success) {
            $routeTemplate = $pageMatch.Groups[1].Value
        }
    }

    $modelMatch = [regex]::Match($text, '(?m)^\s*@model\s+([A-Za-z0-9_.]+)')
    if ($modelMatch.Success) {
        $modelType = $modelMatch.Groups[1].Value
    }

    return [ordered]@{
        RelativePath = $RelativePath
        Kind = "cshtml"
        HasPageDirective = $hasPageDirective
        RouteTemplate = $routeTemplate
        ModelType = $modelType
    }
}

function Get-RazorComponentSummary {
    param(
        [string]$Path,
        [string]$RelativePath
    )

    $text = Get-Content -Path $Path -Raw -ErrorAction Stop

    $routeTemplates = [regex]::Matches($text, '(?m)^\s*@page\s+"([^"]+)"') |
        ForEach-Object { $_.Groups[1].Value } |
        Select-Object -Unique

    $codeHints = @()
    if ($text -match '@code\s*\{') {
        $codeHints += "inline-code"
    }

    return [ordered]@{
        RelativePath = $RelativePath
        Kind = "razor"
        Routes = @($routeTemplates)
        Hints = @($codeHints)
    }
}

function Build-FileSummary {
    param(
        [object]$Record,
        $SettingsValues
    )

    if (-not (Should-SummarizeFile -Record $Record -SettingsValues $SettingsValues)) {
        return $null
    }

    switch ($Record.Extension) {
        ".cs" {
            return Get-CSharpFileSummary -Path $Record.File.FullName -RelativePath $Record.RelativePath
        }
        ".cshtml" {
            return Get-CshtmlFileSummary -Path $Record.File.FullName -RelativePath $Record.RelativePath
        }
        ".razor" {
            return Get-RazorComponentSummary -Path $Record.File.FullName -RelativePath $Record.RelativePath
        }
        default {
            return $null
        }
    }
}

function New-FileRecord {
    param(
        [System.IO.FileInfo]$File,
        [string]$Root,
        [string[]]$WhitelistPatterns,
        [string[]]$IgnorePatterns
    )

    $relative = Get-RelativePathSafe -BasePath $Root -TargetPath $File.FullName
    $relative = $relative.Replace('/', '\')

    $whitelisted = Test-PatternMatch -RelativePath $relative -Patterns $WhitelistPatterns
    $ignored = Test-PatternMatch -RelativePath $relative -Patterns $IgnorePatterns

    $include = $whitelisted -and (-not $ignored)

    [PSCustomObject]@{
        File = $File
        RelativePath = $relative
        Name = $File.Name
        Extension = $File.Extension.ToLowerInvariant()
        Length = $File.Length
        LastWriteTimeUtc = $File.LastWriteTimeUtc
        SourceSignature = "$($File.Length)|$($File.LastWriteTimeUtc.Ticks)"
        Whitelisted = $whitelisted
        Ignored = $ignored
        Include = $include
        Category = Get-FileCategory -RelativePath $relative -Name $File.Name -Extension $File.Extension
        Priority = Get-PriorityScore -RelativePath $relative -Name $File.Name -Extension $File.Extension -Length $File.Length
    }
}

function Build-OrReuseFragments {
    param(
        [string]$FragmentDir,
        [object[]]$IncludedRecords,
        [hashtable]$Manifest,
        $SettingsValues
    )

    $results = New-Object System.Collections.Generic.List[object]
    $newFileMap = @{}
    $changedAnything = $false

    foreach ($record in $IncludedRecords) {
        $relative = $record.RelativePath
        $existing = $null
        if ($Manifest.Files.ContainsKey($relative)) {
            $existing = $Manifest.Files[$relative]
        }

        $fragmentName = Get-FragmentFileName -RelativePath $relative
        $fragmentPath = Join-Path $FragmentDir $fragmentName

        $needsRebuild = $true
        $sourceHash = ""

        if ($SettingsValues.SkipUnalteredFiles -and $existing -and (Test-Path $fragmentPath)) {
            if ($existing.SourceSignature -eq $record.SourceSignature) {
                $needsRebuild = $false
            }
            else {
                $sourceHash = Get-Sha256Hex -Path $record.File.FullName
                if ($existing.SourceHash -eq $sourceHash) {
                    $needsRebuild = $false
                }
            }
        }

        if ($needsRebuild) {
            if (-not $sourceHash) {
                $sourceHash = Get-Sha256Hex -Path $record.File.FullName
            }

            $fragment = Build-FragmentText `
                -File $record.File `
                -RelativePath $relative `
                -Category $record.Category `
                -Whitelisted $record.Whitelisted `
                -MaxFileBytes ([int]$SettingsValues.MaxFileBytes)

            $wrote = Save-TextIfChanged -Path $fragmentPath -Content $fragment.BlockText
            if ($wrote) {
                $changedAnything = $true
            }

            $meta = [ordered]@{
                RelativePath = $relative
                FragmentPath = $fragmentPath
                SummaryPath = ""
                SourceSignature = $record.SourceSignature
                SourceHash = $sourceHash
                OriginalBytes = $fragment.OriginalBytes
                EmittedBytes = $fragment.EmittedBytes
                Truncated = $fragment.Truncated
                Category = $record.Category
                Priority = $record.Priority
            }
        }
        else {
            $meta = [ordered]@{
                RelativePath = $relative
                FragmentPath = $fragmentPath
                SummaryPath = $existing.SummaryPath
                SourceSignature = $existing.SourceSignature
                SourceHash = $existing.SourceHash
                OriginalBytes = [int64]$existing.OriginalBytes
                EmittedBytes = [int64]$existing.EmittedBytes
                Truncated = [bool]$existing.Truncated
                Category = [int]$existing.Category
                Priority = [int]$existing.Priority
            }
        }

        $newFileMap[$relative] = $meta
        $results.Add([PSCustomObject]$meta) | Out-Null
    }

    return [PSCustomObject]@{
        FileMap = $newFileMap
        FragmentMetadata = $results
        ChangedAnything = $changedAnything
    }
}

function Build-OrReuseSummaries {
    param(
        [string]$SummaryDir,
        [object[]]$IncludedRecords,
        [hashtable]$Manifest,
        $SettingsValues
    )

    $summaryMap = @{}
    $changedAnything = $false

    foreach ($record in $IncludedRecords) {
        if (-not (Should-SummarizeFile -Record $record -SettingsValues $SettingsValues)) {
            continue
        }

        $relative = $record.RelativePath
        $existing = $null
        if ($Manifest.Files.ContainsKey($relative)) {
            $existing = $Manifest.Files[$relative]
        }

        $summaryName = Get-SummaryFileName -RelativePath $relative
        $summaryPath = Join-Path $SummaryDir $summaryName

        $needsRebuild = $true
        if ($SettingsValues.SkipUnalteredFiles -and $existing -and $existing.SummaryPath -and (Test-Path $existing.SummaryPath)) {
            if ($existing.SourceSignature -eq $record.SourceSignature) {
                $needsRebuild = $false
            }
        }

        if ($needsRebuild) {
            $summaryObj = Build-FileSummary -Record $record -SettingsValues $SettingsValues

            if ($null -ne $summaryObj) {
                $json = $summaryObj | ConvertTo-Json -Depth 20
                $wrote = Save-TextIfChanged -Path $summaryPath -Content $json
                if ($wrote) {
                    $changedAnything = $true
                }
            }
        }

        if (Test-Path $summaryPath) {
            $summaryMap[$relative] = $summaryPath
        }
    }

    return [PSCustomObject]@{
        SummaryMap = $summaryMap
        ChangedAnything = $changedAnything
    }
}

function Remove-OrphanedArtifacts {
    param(
        [hashtable]$OldFiles,
        [hashtable]$NewFiles,
        [bool]$Enabled
    )

    $removed = $false

    if (-not $Enabled) {
        return $false
    }

    foreach ($key in $OldFiles.Keys) {
        if (-not $NewFiles.ContainsKey($key)) {
            $old = $OldFiles[$key]

            if ($old.FragmentPath -and (Test-Path $old.FragmentPath)) {
                Remove-Item -Path $old.FragmentPath -Force -ErrorAction SilentlyContinue
                $removed = $true
            }

            if ($old.SummaryPath -and (Test-Path $old.SummaryPath)) {
                Remove-Item -Path $old.SummaryPath -Force -ErrorAction SilentlyContinue
                $removed = $true
            }
        }
    }

    return $removed
}

function Build-EmissionPlan {
    param(
        [object[]]$FragmentMetadata,
        [int]$SoftContextBytes
    )

    $header = @"
SOLUTION CONTEXT
Generated: $(Get-Date -Format s)

Ordered for LLM comprehension: solution > projects > startup/config > contracts > domain > services > data > endpoints > frontend > other

"@

    $utf8 = [System.Text.Encoding]::UTF8
    $runningBytes = $utf8.GetByteCount($header)
    $results = New-Object System.Collections.Generic.List[object]

    foreach ($meta in $FragmentMetadata | Sort-Object Priority, RelativePath) {
        if (($runningBytes + [int64]$meta.EmittedBytes) -le $SoftContextBytes) {
            $runningBytes += [int64]$meta.EmittedBytes
            $results.Add([PSCustomObject]@{
                RelativePath = $meta.RelativePath
                Category = $meta.Category
                Status = "Included"
                Truncated = $meta.Truncated
                OriginalBytes = $meta.OriginalBytes
                EmittedBytes = $meta.EmittedBytes
                FragmentPath = $meta.FragmentPath
            }) | Out-Null
        }
        else {
            $results.Add([PSCustomObject]@{
                RelativePath = $meta.RelativePath
                Category = $meta.Category
                Status = "SkippedForBudget"
                Truncated = $meta.Truncated
                OriginalBytes = $meta.OriginalBytes
                EmittedBytes = 0
                FragmentPath = $meta.FragmentPath
            }) | Out-Null
        }
    }

    return $results
}

function Build-ContextText {
    param(
        [object[]]$EmissionPlan,
        [bool]$MergeIndexIntoContext,
        [string]$IndexText
    )

    $sb = New-Object System.Text.StringBuilder

    if ($MergeIndexIntoContext) {
        [void]$sb.AppendLine($IndexText)
        [void]$sb.AppendLine()
        [void]$sb.AppendLine("================================================================================")
        [void]$sb.AppendLine()
    }

    [void]$sb.AppendLine("SOLUTION CONTEXT")
    [void]$sb.AppendLine("Generated: $(Get-Date -Format s)")
    [void]$sb.AppendLine("Ordered for LLM comprehension: solution > projects > startup/config > contracts > domain > services > data > endpoints > frontend > other")
    [void]$sb.AppendLine()

    foreach ($item in $EmissionPlan | Where-Object { $_.Status -eq "Included" }) {
        $fragmentText = Get-Content -Path $item.FragmentPath -Raw
        [void]$sb.Append($fragmentText)
    }

    return $sb.ToString()
}

function Write-IndexText {
    param(
        [string]$Root,
        [string]$SettingsPath,
        $SettingsValues,
        [object[]]$IncludedRecords,
        [object[]]$ExcludedRecords,
        [object[]]$EmissionResults,
        [hashtable]$FileMap
    )

    $sb = New-Object System.Text.StringBuilder

    $solutions = $IncludedRecords | Where-Object { $_.Extension -eq ".sln" }
    $projects = $IncludedRecords | Where-Object { $_.Extension -eq ".csproj" }
    $configFiles = $IncludedRecords | Where-Object {
        $_.Name -match '^(Program\.cs|Startup\.cs|appsettings(\..+)?\.json|launchSettings\.json|Dockerfile|docker-compose.*|README(\..*)?)$'
    }

    $truncated = $EmissionResults | Where-Object { $_.Truncated }
    $skippedForBudget = $EmissionResults | Where-Object { $_.Status -eq "SkippedForBudget" }

    $pageSummaries = @()
    $dalSummaries = @()
    $modelSummaries = @()
    $serviceSummaries = @()

    foreach ($key in ($FileMap.Keys | Sort-Object)) {
        $meta = $FileMap[$key]
        if (-not $meta.SummaryPath -or -not (Test-Path $meta.SummaryPath)) {
            continue
        }

        $summary = Get-Content -Path $meta.SummaryPath -Raw | ConvertFrom-Json -Depth 20

        if ($summary.Kind -eq "cshtml" -and $summary.HasPageDirective) {
            $pageSummaries += $summary
            continue
        }

        if ($summary.Kind -eq "csharp") {
            if ($summary.IsPageModel -or ($summary.PublicMethods | Where-Object { $_ -like "OnGet*" -or $_ -like "OnPost*" })) {
                $pageSummaries += $summary
                continue
            }

            if ($summary.IsDalLike) {
                $dalSummaries += $summary
                continue
            }

            if ($summary.RelativePath -match '\\(Models|Entities|DTOs|ViewModels)\\') {
                $modelSummaries += $summary
                continue
            }

            if ($summary.RelativePath -match '\\(Services|Helpers|Providers|Managers)\\') {
                $serviceSummaries += $summary
                continue
            }
        }
    }

    [void]$sb.AppendLine("SOLUTION INDEX")
    [void]$sb.AppendLine("Root: $Root")
    [void]$sb.AppendLine("Generated: $(Get-Date -Format s)")
    [void]$sb.AppendLine("SettingsFile: $SettingsPath")
    [void]$sb.AppendLine("Enabled: $($SettingsValues.Enabled)")
    [void]$sb.AppendLine("SkipUnalteredFiles: $($SettingsValues.SkipUnalteredFiles)")
    [void]$sb.AppendLine("GenerateCodeSummary: $($SettingsValues.GenerateCodeSummary)")
    [void]$sb.AppendLine("Per-file UTF8 byte limit: $($SettingsValues.MaxFileBytes)")
    [void]$sb.AppendLine("Soft total UTF8 byte budget: $($SettingsValues.SoftContextBytes)")
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("SUMMARY")
    [void]$sb.AppendLine("- Included candidate files: $($IncludedRecords.Count)")
    [void]$sb.AppendLine("- Excluded files: $($ExcludedRecords.Count)")
    [void]$sb.AppendLine("- Emitted into solution-context.txt: $(($EmissionResults | Where-Object { $_.Status -eq 'Included' }).Count)")
    [void]$sb.AppendLine("- Truncated files: $($truncated.Count)")
    [void]$sb.AppendLine("- Skipped due to total budget: $($skippedForBudget.Count)")
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("SOLUTIONS")
    foreach ($r in $solutions) {
        [void]$sb.AppendLine("- $($r.RelativePath)")
    }
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("PROJECTS")
    foreach ($r in $projects) {
        [void]$sb.AppendLine("- $($r.RelativePath)")
    }
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("KEY CONFIG / STARTUP FILES")
    foreach ($r in $configFiles | Sort-Object RelativePath) {
        [void]$sb.AppendLine("- $($r.RelativePath)")
    }
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("RAZOR PAGES")
    foreach ($p in $pageSummaries | Sort-Object RelativePath) {
        if ($p.Kind -eq "cshtml") {
            $routeText = if ($p.RouteTemplate) { $p.RouteTemplate } else { "(default route)" }
            $modelText = if ($p.ModelType) { $p.ModelType } else { "(no model detected)" }
            [void]$sb.AppendLine("- $($p.RelativePath) | route=$routeText | model=$modelText")
        }
        elseif ($p.Kind -eq "csharp") {
            $handlers = @($p.PageHandlers) -join ", "
            if (-not $handlers) { $handlers = "(none detected)" }
            $classText = if ($p.ClassName) { $p.ClassName } else { "(unknown class)" }
            [void]$sb.AppendLine("- $($p.RelativePath) | pageModel=$classText | handlers=$handlers")
        }
    }
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("DAL / DATA ACCESS")
    foreach ($d in $dalSummaries | Sort-Object RelativePath) {
        $classText = if ($d.ClassName) { $d.ClassName } else { "(unknown class)" }
        $methods = @($d.PublicMethods | Select-Object -First 12) -join ", "
        if (-not $methods) { $methods = "(no public methods detected)" }
        $sqlOps = @($d.SqlOps) -join ", "
        if (-not $sqlOps) { $sqlOps = "(no SQL ops detected)" }

        [void]$sb.AppendLine("- $($d.RelativePath) | class=$classText | methods=$methods | sql=$sqlOps")
    }
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("MODELS / DTOS / VIEWMODELS")
    foreach ($m in $modelSummaries | Sort-Object RelativePath) {
        $classText = if ($m.ClassName) { $m.ClassName } else { "(unknown class)" }
        [void]$sb.AppendLine("- $($m.RelativePath) | class=$classText")
    }
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("SERVICES / HELPERS")
    foreach ($s in $serviceSummaries | Sort-Object RelativePath) {
        $classText = if ($s.ClassName) { $s.ClassName } else { "(unknown class)" }
        $methods = @($s.PublicMethods | Select-Object -First 12) -join ", "
        if (-not $methods) { $methods = "(no public methods detected)" }

        [void]$sb.AppendLine("- $($s.RelativePath) | class=$classText | methods=$methods")
    }
    [void]$sb.AppendLine()

    [void]$sb.AppendLine("FILES INCLUDED IN solution-context.txt")
    foreach ($e in $EmissionResults | Where-Object { $_.Status -eq "Included" }) {
        $tag = if ($e.Truncated) { "TRUNCATED" } else { "FULL" }
        [void]$sb.AppendLine("- [$tag] $($e.RelativePath) | category=$($e.Category) | sourceBytes=$($e.OriginalBytes) | emittedBytes=$($e.EmittedBytes)")
    }
    [void]$sb.AppendLine()

    if ($skippedForBudget.Count -gt 0) {
        [void]$sb.AppendLine("FILES SKIPPED DUE TO TOTAL SIZE BUDGET")
        foreach ($e in $skippedForBudget) {
            [void]$sb.AppendLine("- $($e.RelativePath) | category=$($e.Category) | sourceBytes=$($e.OriginalBytes)")
        }
        [void]$sb.AppendLine()
    }

    if ($ExcludedRecords.Count -gt 0) {
        [void]$sb.AppendLine("FILES EXCLUDED BY RULES")
        foreach ($r in $ExcludedRecords | Sort-Object RelativePath) {
            $reason = if (-not $r.Whitelisted) { "not-whitelisted" } elseif ($r.Ignored) { "ignored" } else { "excluded" }
            [void]$sb.AppendLine("- $($r.RelativePath) | $reason")
        }
        [void]$sb.AppendLine()
    }

    return $sb.ToString()
}

# Main
$scriptDir = $PSScriptRoot
$solutionRoot = Get-SolutionRoot -StartDir $scriptDir

$controlFiles = Ensure-ControlFiles -Root $solutionRoot
$whitelistPatterns = Read-PatternFile -Path $controlFiles.WhitelistPath
$ignorePatterns = Read-PatternFile -Path $controlFiles.IgnorePath

$settingsInfo = Load-BuildSettings -Root $solutionRoot -ExplicitSettingsFile $SettingsFile -SectionName $SettingsSection
$settings = $settingsInfo.Values

if (-not $settings.Enabled) {
    Write-Host "LLM context generation is disabled. Set $SettingsSection.Enabled=true to enable."
    exit 0
}

$outDir = Join-Path $solutionRoot $settings.OutputFolderName
$cacheDir = Join-Path $outDir ".cache"
$fragmentDir = Join-Path $cacheDir "fragments"
$summaryDir = Join-Path $cacheDir "summaries"
$manifestPath = Join-Path $cacheDir "manifest.json"
$indexPath = Join-Path $outDir "solution-index.txt"
$contextPath = Join-Path $outDir "solution-context.txt"

foreach ($dir in @($outDir, $cacheDir, $fragmentDir, $summaryDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
}

$manifest = Load-Manifest -Path $manifestPath
$settingsSignature = Get-SettingsSignature -SettingsObject $settings

$allFiles = Get-ChildItem -Path $solutionRoot -Recurse -File | Where-Object {
    $_.FullName -notlike "$outDir*"
}

$records = foreach ($file in $allFiles) {
    New-FileRecord `
        -File $file `
        -Root $solutionRoot `
        -WhitelistPatterns $whitelistPatterns `
        -IgnorePatterns $ignorePatterns
}

$includedRecords = $records | Where-Object { $_.Include } | Sort-Object Priority, RelativePath
$excludedRecords = $records | Where-Object { -not $_.Include } | Sort-Object RelativePath

$fragmentRun = Build-OrReuseFragments `
    -FragmentDir $fragmentDir `
    -IncludedRecords $includedRecords `
    -Manifest $manifest `
    -SettingsValues $settings

$summaryRun = Build-OrReuseSummaries `
    -SummaryDir $summaryDir `
    -IncludedRecords $includedRecords `
    -Manifest $manifest `
    -SettingsValues $settings

foreach ($key in $fragmentRun.FileMap.Keys) {
    if ($summaryRun.SummaryMap.ContainsKey($key)) {
        $fragmentRun.FileMap[$key].SummaryPath = $summaryRun.SummaryMap[$key]
    }
}

$orphanRemoved = Remove-OrphanedArtifacts `
    -OldFiles $manifest.Files `
    -NewFiles $fragmentRun.FileMap `
    -Enabled ([bool]$settings.CleanOrphanedFragments)

$emissionPlan = Build-EmissionPlan `
    -FragmentMetadata $fragmentRun.FragmentMetadata `
    -SoftContextBytes ([int]$settings.SoftContextBytes)

$indexText = Write-IndexText `
    -Root $solutionRoot `
    -SettingsPath $settingsInfo.Path `
    -SettingsValues $settings `
    -IncludedRecords $includedRecords `
    -ExcludedRecords $excludedRecords `
    -EmissionResults $emissionPlan `
    -FileMap $fragmentRun.FileMap

$contextText = Build-ContextText `
    -EmissionPlan $emissionPlan `
    -MergeIndexIntoContext ([bool]$settings.MergeIndexIntoContext) `
    -IndexText $indexText

$currentIncludedOrder = @($includedRecords | ForEach-Object { $_.RelativePath })
$currentEmittedOrder = @($emissionPlan | Where-Object { $_.Status -eq "Included" } | ForEach-Object { $_.RelativePath })

$indexChanged = Save-TextIfChanged -Path $indexPath -Content $indexText
$contextChanged = Save-TextIfChanged -Path $contextPath -Content $contextText

$manifest.Version = 1
$manifest.SettingsSignature = $settingsSignature
$manifest.Files = $fragmentRun.FileMap
$manifest.IncludedOrder = $currentIncludedOrder
$manifest.EmittedOrder = $currentEmittedOrder

Save-Manifest -Path $manifestPath -Manifest $manifest

if ($settings.Verbose) {
    Write-Host "Fragments changed: $($fragmentRun.ChangedAnything)"
    Write-Host "Summaries changed: $($summaryRun.ChangedAnything)"
    Write-Host "Orphans removed: $orphanRemoved"
    Write-Host "Index changed: $indexChanged"
    Write-Host "Context changed: $contextChanged"
}

Write-Host "LLM context complete:"
Write-Host "  $indexPath"
Write-Host "  $contextPath"
