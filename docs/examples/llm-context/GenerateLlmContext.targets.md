# .csproj build target snippet

Use `pwsh` so the same target works on Windows, macOS, Linux, and in CI.

```xml
<PropertyGroup>
  <GenerateLlmContext>true</GenerateLlmContext>
</PropertyGroup>

<Target Name="GenerateLlmContext"
        BeforeTargets="BeforeBuild"
        Condition="'$(DesignTimeBuild)' != 'true' and '$(GenerateLlmContext)' == 'true'">
  <Exec Command='pwsh -NoProfile -ExecutionPolicy Bypass -File &quot;$(SolutionDir)tools\Generate-LlmContext.ps1&quot; -ProjectPath &quot;$(MSBuildProjectDirectory)&quot;' />
</Target>
```

Recommended placement in a real solution:

- `tools/Generate-LlmContext.ps1`
- `appsettings.llmcontext.json` at the solution root
- `.llmignore` at the solution root
- `.llmwhitelist` at the solution root
- generated output under `llm-context/`