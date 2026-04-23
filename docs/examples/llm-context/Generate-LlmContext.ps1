[CmdletBinding()]
param(
    [string]$ProjectPath = (Get-Location).Path,
    [string]$ConfigFileName = "appsettings.llmcontext.json"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Resolve-SolutionRoot {
    param([string]$StartPath)

    $current = Get-Item -LiteralPath $StartPath
    if ($current.PSIsContainer -eq $false) {
        $current = $current.Directory
    }

    while ($null -ne $current) {
        $solution = Get-ChildItem -LiteralPath $current.FullName -Filter *.sln -File -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($null -ne $solution) {
            return $current.FullName
        }

        $current = $current.Parent
    }

    throw "Unable to locate a solution root. Start from a project folder or any child folder beneath a directory that contains a .sln file."
}

function ConvertTo-RelativeSolutionPath {
    param(
        [string]$BasePath,
        [string]$FullPath
    )

    $relative = [System.IO.Path]::GetRelativePath($BasePath, $FullPath)
    return $relative.Replace("\", "/")
}

function Get-DefaultSettings {
    return [ordered]@{
        OutputDirectory = "llm-context"
        MaxFileBytes = 262144
        SoftContextBytes = 786432
        MaxSummaryFileBytes = 16384
        EnableFrontendSummaries = $false
        FrontendSummaryExtensions = @(".js", ".ts", ".tsx", ".jsx", ".css", ".scss", ".html")
        BuiltInWhitelist = @("**/*.cs", "**/*.cshtml", "**/*.sql", "**/*.json", "**/*.config", "**/*.csproj", "**/*.props", "**/*.targets")
        BuiltInIgnore = @("**/bin/**", "**/obj/**", "**/.git/**", "**/node_modules/**", "**/dist/**", "**/wwwroot/lib/**", "**/llm-context/**")
    }
}

function Merge-Settings {
    param(
        [hashtable]$Defaults,
        [object]$Loaded
    )

    $merged = [ordered]@{}
    foreach ($key in $Defaults.Keys) {
        $merged[$key] = $Defaults[$key]
    }

    if ($null -eq $Loaded) {
        return $merged
    }

    foreach ($property in $Loaded.PSObject.Properties) {
        $merged[$property.Name] = $property.Value
    }

    return $merged
}

function Read-OptionalJsonFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return $null
    }

    return $raw | ConvertFrom-Json -Depth 20
}

function Read-PatternFile {
    param(
        [string]$Path,
        [string[]]$FallbackPatterns
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $FallbackPatterns
    }

    $patterns = Get-Content -LiteralPath $Path -Encoding UTF8 |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -and -not $_.StartsWith("#") }

    if ($patterns.Count -eq 0) {
        return $FallbackPatterns
    }

    return $patterns
}

function Convert-GlobToRegex {
    param([string]$Pattern)

    $normalized = $Pattern.Replace("\", "/")
    $escaped = [Regex]::Escape($normalized)
    $escaped = $escaped -replace "\\\*\\\*", ".*"
    $escaped = $escaped -replace "\\\*", "[^/]*"
    $escaped = $escaped -replace "\\\?", "."
    return "^$escaped$"
}

function Test-AnyPatternMatch {
    param(
        [string]$RelativePath,
        [string[]]$Patterns
    )

    foreach ($pattern in $Patterns) {
        if ($RelativePath -match (Convert-GlobToRegex -Pattern $pattern)) {
            return $true
        }
    }

    return $false
}

function Get-CacheKey {
    param([string]$RelativePath)

    $sha1 = [System.Security.Cryptography.SHA1]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($RelativePath.ToLowerInvariant())
        $hashBytes = $sha1.ComputeHash($bytes)
        return -join ($hashBytes | ForEach-Object { $_.ToString("x2") })
    }
    finally {
        $sha1.Dispose()
    }
}

function Get-TrimmedText {
    param(
        [string]$Text,
        [int]$MaxBytes
    )

    $bytes = [System.Text.Encoding]::UTF8.GetByteCount($Text)
    if ($bytes -le $MaxBytes) {
        return $Text
    }

    $ratio = [Math]::Max(0.15, $MaxBytes / [double]$bytes)
    $length = [Math]::Max(256, [int]($Text.Length * $ratio))
    return $Text.Substring(0, [Math]::Min($length, $Text.Length)) + "`n`n... [truncated to respect MaxFileBytes]"
}

function Get-PageTypeSummary {
    param(
        [string]$RelativePath,
        [string]$Text
    )

    $summary = New-Object System.Collections.Generic.List[string]
    $extension = [System.IO.Path]::GetExtension($RelativePath).ToLowerInvariant()
    $lowerPath = $RelativePath.ToLowerInvariant()

    if ($RelativePath.ToLowerInvariant().EndsWith(".cshtml")) {
        if ($Text -match "(?m)^\s*@page\b") {
            $summary.Add("Razor Page detected via @page.")
        }
        else {
            $summary.Add("Razor partial or shared view fragment.")
        }

        $modelMatch = [Regex]::Match($Text, "(?m)^\s*@model\s+([A-Za-z0-9_\.]+)")
        if ($modelMatch.Success) {
            $summary.Add("Model: $($modelMatch.Groups[1].Value)")
        }

        return $summary
    }

    if ($RelativePath.ToLowerInvariant().EndsWith(".cshtml.cs")) {
        $classMatch = [Regex]::Match($Text, "\bclass\s+([A-Za-z0-9_]+)")
        if ($classMatch.Success) {
            $summary.Add("PageModel class: $($classMatch.Groups[1].Value)")
        }

        $handlerMatches = [Regex]::Matches($Text, "\b(On(?:Get|Post|Put|Delete|Patch)[A-Za-z0-9_]*)(?:Async)?\s*\(") |
            ForEach-Object { $_.Groups[1].Value } |
            Select-Object -Unique

        if ($handlerMatches.Count -gt 0) {
            $summary.Add("Handlers: " + ($handlerMatches -join ", "))
        }

        return $summary
    }

    if ($extension -eq ".cs") {
        $classMatches = [Regex]::Matches($Text, "\bclass\s+([A-Za-z0-9_]+)") |
            ForEach-Object { $_.Groups[1].Value } |
            Select-Object -Unique

        $isDal = $lowerPath -match "(^|/)(dal|data|repositories|repository)(/|$)" -or
            ($classMatches | Where-Object { $_ -match "(Dal|Repository|Queries|Commands|Db)$" }).Count -gt 0

        if ($isDal) {
            $summary.Add("DAL-oriented C# file detected.")
        }
        elseif ($lowerPath -match "(^|/)pages(/|$)") {
            $summary.Add("C# file under Pages/ path.")
        }

        if ($classMatches.Count -gt 0) {
            $summary.Add("Classes: " + ($classMatches -join ", "))
        }

        $methodMatches = [Regex]::Matches($Text, "(?m)^\s*(?:public|internal)\s+(?:async\s+)?(?:[A-Za-z0-9_<>,\[\]\.?]+\s+)+([A-Za-z0-9_]+)\s*\(") |
            ForEach-Object { $_.Groups[1].Value } |
            Where-Object { $_ -notmatch "^(if|for|foreach|while|switch)$" } |
            Select-Object -Unique

        if ($methodMatches.Count -gt 0) {
            $summary.Add("Methods: " + (($methodMatches | Select-Object -First 8) -join ", "))
        }
    }

    $sqlHints = [Regex]::Matches($Text, "\b(SELECT|INSERT|UPDATE|DELETE|MERGE|EXEC(?:UTE)?)\b", [System.Text.RegularExpressions.RegexOptions]::IgnoreCase) |
        ForEach-Object { $_.Groups[1].Value.ToUpperInvariant() } |
        Select-Object -Unique

    if ($sqlHints.Count -gt 0) {
        $summary.Add("SQL hints: " + ($sqlHints -join ", "))
    }

    if ($extension -eq ".sql") {
        $summary.Add("SQL script or embedded query file.")
    }

    return $summary
}

function New-FileSummary {
    param(
        [string]$RelativePath,
        [string]$Text,
        [hashtable]$Settings
    )

    $extension = [System.IO.Path]::GetExtension($RelativePath).ToLowerInvariant()
    $frontendSummaryExtensions = @($Settings.FrontendSummaryExtensions | ForEach-Object { $_.ToLowerInvariant() })

    if (($frontendSummaryExtensions -contains $extension) -and -not [bool]$Settings.EnableFrontendSummaries) {
        return "Frontend summary skipped by configuration for $RelativePath."
    }

    $summaryLines = Get-PageTypeSummary -RelativePath $RelativePath -Text $Text
    if ($summaryLines.Count -eq 0) {
        $summaryLines.Add("General source/config file included for context.")
    }

    $summary = @(
        "Path: $RelativePath"
        "Summary:"
        ($summaryLines | ForEach-Object { "- $_" })
    ) -join "`n"

    return Get-TrimmedText -Text $summary -MaxBytes ([int]$Settings.MaxSummaryFileBytes)
}

function New-ContextFragment {
    param(
        [string]$RelativePath,
        [string]$Summary,
        [string]$Text,
        [hashtable]$Settings
    )

    $trimmedContent = Get-TrimmedText -Text $Text -MaxBytes ([int]$Settings.MaxFileBytes)
    return @(
        "--- BEGIN FILE: $RelativePath ---"
        $Summary
        "Content:"
        $trimmedContent
        "--- END FILE: $RelativePath ---"
    ) -join "`n"
}

function Write-TextIfChanged {
    param(
        [string]$Path,
        [string]$Content
    )

    if ((Test-Path -LiteralPath $Path) -and ((Get-Content -LiteralPath $Path -Raw -Encoding UTF8) -ceq $Content)) {
        return $false
    }

    Set-Content -LiteralPath $Path -Value $Content -Encoding UTF8
    return $true
}

function Load-ManifestLookup {
    param([string]$ManifestPath)

    $lookup = @{}
    if (-not (Test-Path -LiteralPath $ManifestPath)) {
        return $lookup
    }

    $manifest = Read-OptionalJsonFile -Path $ManifestPath
    if ($null -eq $manifest -or $null -eq $manifest.Files) {
        return $lookup
    }

    foreach ($entry in $manifest.Files) {
        $lookup[$entry.Path] = $entry
    }

    return $lookup
}

$solutionRoot = Resolve-SolutionRoot -StartPath $ProjectPath
$settings = Merge-Settings -Defaults (Get-DefaultSettings) -Loaded (Read-OptionalJsonFile -Path (Join-Path $solutionRoot $ConfigFileName))

$whitelist = Read-PatternFile -Path (Join-Path $solutionRoot ".llmwhitelist") -FallbackPatterns @($settings.BuiltInWhitelist)
$ignore = Read-PatternFile -Path (Join-Path $solutionRoot ".llmignore") -FallbackPatterns @($settings.BuiltInIgnore)

$outputRoot = Join-Path $solutionRoot $settings.OutputDirectory
$cacheRoot = Join-Path $outputRoot ".cache"
$fragmentCacheRoot = Join-Path $cacheRoot "fragments"
$summaryCacheRoot = Join-Path $cacheRoot "summaries"
$manifestPath = Join-Path $cacheRoot "manifest.json"
$indexPath = Join-Path $outputRoot "solution-index.txt"
$contextPath = Join-Path $outputRoot "solution-context.txt"

foreach ($path in @($outputRoot, $cacheRoot, $fragmentCacheRoot, $summaryCacheRoot)) {
    if (-not (Test-Path -LiteralPath $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
    }
}

$manifestLookup = Load-ManifestLookup -ManifestPath $manifestPath
$files = Get-ChildItem -LiteralPath $solutionRoot -Recurse -File -ErrorAction SilentlyContinue

$candidateFiles = foreach ($file in $files) {
    $relativePath = ConvertTo-RelativeSolutionPath -BasePath $solutionRoot -FullPath $file.FullName
    if (-not (Test-AnyPatternMatch -RelativePath $relativePath -Patterns $whitelist)) {
        continue
    }

    if (Test-AnyPatternMatch -RelativePath $relativePath -Patterns $ignore) {
        continue
    }

    [PSCustomObject]@{
        FileInfo = $file
        RelativePath = $relativePath
    }
}

$indexEntries = New-Object System.Collections.Generic.List[string]
$contextFragments = New-Object System.Collections.Generic.List[string]
$manifestEntries = New-Object System.Collections.Generic.List[object]
$contextBudget = 0
$reusedCount = 0
$regeneratedCount = 0

foreach ($candidate in ($candidateFiles | Sort-Object RelativePath)) {
    $fileInfo = $candidate.FileInfo
    $relativePath = $candidate.RelativePath
    $cacheKey = Get-CacheKey -RelativePath $relativePath
    $fragmentCachePath = Join-Path $fragmentCacheRoot "$cacheKey.txt"
    $summaryCachePath = Join-Path $summaryCacheRoot "$cacheKey.txt"
    $lastWriteUtcTicks = $fileInfo.LastWriteTimeUtc.Ticks
    $cachedEntry = $manifestLookup[$relativePath]
    $shouldReuse = $false
    $hash = $null

    if ($null -ne $cachedEntry -and
        $cachedEntry.Size -eq $fileInfo.Length -and
        $cachedEntry.LastWriteUtcTicks -eq $lastWriteUtcTicks -and
        (Test-Path -LiteralPath $fragmentCachePath) -and
        (Test-Path -LiteralPath $summaryCachePath)) {
        $shouldReuse = $true
        $hash = $cachedEntry.Hash
    }
    else {
        $hash = (Get-FileHash -LiteralPath $fileInfo.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($null -ne $cachedEntry -and
            $cachedEntry.Hash -eq $hash -and
            (Test-Path -LiteralPath $fragmentCachePath) -and
            (Test-Path -LiteralPath $summaryCachePath)) {
            $shouldReuse = $true
        }
    }

    if ($shouldReuse) {
        $summary = Get-Content -LiteralPath $summaryCachePath -Raw -Encoding UTF8
        $fragment = Get-Content -LiteralPath $fragmentCachePath -Raw -Encoding UTF8
        $reusedCount++
    }
    else {
        $text = Get-Content -LiteralPath $fileInfo.FullName -Raw -Encoding UTF8
        $summary = New-FileSummary -RelativePath $relativePath -Text $text -Settings $settings
        $fragment = New-ContextFragment -RelativePath $relativePath -Summary $summary -Text $text -Settings $settings
        Set-Content -LiteralPath $summaryCachePath -Value $summary -Encoding UTF8
        Set-Content -LiteralPath $fragmentCachePath -Value $fragment -Encoding UTF8
        $regeneratedCount++
    }

    $indexSummaryLine = ($summary -split "`n" | Select-Object -Skip 2 | ForEach-Object { $_.TrimStart("- ") } | Where-Object { $_ } | Select-Object -First 2) -join "; "
    if ([string]::IsNullOrWhiteSpace($indexSummaryLine)) {
        $indexSummaryLine = "General source or configuration file."
    }

    $indexEntries.Add("- $relativePath | $indexSummaryLine")

    $fragmentBytes = [System.Text.Encoding]::UTF8.GetByteCount($fragment)
    if ($contextFragments.Count -eq 0 -or ($contextBudget + $fragmentBytes) -le [int]$settings.SoftContextBytes) {
        $contextFragments.Add($fragment)
        $contextBudget += $fragmentBytes
    }

    $manifestEntries.Add([PSCustomObject]@{
        Path = $relativePath
        Hash = $hash
        Size = $fileInfo.Length
        LastWriteUtcTicks = $lastWriteUtcTicks
        FragmentCache = "fragments/$cacheKey.txt"
        SummaryCache = "summaries/$cacheKey.txt"
    })
}

$indexContent = @(
    "LLM Context Solution Index"
    "SolutionRoot: $solutionRoot"
    "Workflow: Incremental, regex-based, Razor Pages + DAL oriented"
    "Notes:"
    "- Files must match .llmwhitelist and must not match .llmignore."
    "- Summary generation is intentionally shallow and regex-based for build friendliness."
    "- Table schema generation is intentionally out of scope; keep that in a separate script."
    ""
    "Files:"
    ($indexEntries -join "`n")
) -join "`n"

$contextHeader = @(
    "LLM Context Pack"
    "SolutionRoot: $solutionRoot"
    "Focus: ASP.NET Core Razor Pages solutions with DAL classes and no MVC dependency"
    "Notes:"
    "- Solution root is auto-discovered by walking up to the nearest parent folder that contains a .sln file."
    "- Unchanged files reuse cached fragments and cached summaries."
    "- This pass is intentionally regex-based for speed rather than Roslyn-based semantic analysis."
    "- Table schema generation is handled by a separate script."
    ""
) -join "`n"

$contextContent = $contextHeader + ($contextFragments -join "`n`n")

$manifestContent = [PSCustomObject]@{
    SolutionRoot = $solutionRoot
    OutputDirectory = $settings.OutputDirectory
    SoftContextBytes = [int]$settings.SoftContextBytes
    Files = $manifestEntries
} | ConvertTo-Json -Depth 8

$indexUpdated = Write-TextIfChanged -Path $indexPath -Content $indexContent
$contextUpdated = Write-TextIfChanged -Path $contextPath -Content $contextContent
Set-Content -LiteralPath $manifestPath -Value $manifestContent -Encoding UTF8

Write-Host "LLM context complete. Files considered: $($candidateFiles.Count); reused cache: $reusedCount; regenerated: $regeneratedCount; index updated: $indexUpdated; context updated: $contextUpdated"