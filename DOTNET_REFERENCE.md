# .NET Core Implementation Reference

This document explains how the **Chart.js Visualizer** theme system and palette picker was implemented in **ASP.NET Core (.NET 10)** using Razor Pages. Use this as a reference for building similar dynamic theming systems in your .NET applications.

## Architecture Overview

The .NET implementation follows this pattern:

```
ASP.NET Core App
├── Controllers/SandboxController.cs      (Palette endpoint)
├── Models/                                (Data models)
│   ├── ChartData.cs
│   └── Sandbox/ThemePaletteDto.cs
├── Pages/Index.cshtml                    (Razor Page - main view)
├── Pages/Shared/_Layout.cshtml          (Master layout)
├── Views/Shared/_Layout.cshtml          (MVC layout)
├── wwwroot/
│   ├── css/site.css                     (Theme variables)
│   ├── js/site.js                       (Palette picker logic)
│   └── lib/                             (Bootstrap, Chart.js, etc.)
└── Program.cs                            (Service registration)
```

## Server-Side: Controller Endpoint

### SandboxController.cs

The key server-side component is a REST endpoint that serves palette data:

```csharp
[HttpGet]
public async Task<IActionResult> Palettes()
{
    if (_memoryCache.TryGetValue(PalettesCacheKey, out List<ThemePaletteDto>? cached) && cached is not null)
    {
        return Json(cached);
    }

    // Try to fetch trending palettes from Coolors
    var palettes = await TryGetCoolorsTrendingPalettesAsync();
    if (palettes.Count == 0)
    {
        // Fallback to curated palettes
        palettes = GetFallbackPalettes();
    }

    _memoryCache.Set(PalettesCacheKey, palettes, TimeSpan.FromHours(6));
    return Json(palettes);
}
```

**Key Features:**
- Returns JSON list of palettes
- Implements 6-hour caching with `IMemoryCache`
- Attempts live fetch from Coolors with regex parsing
- Falls back to static palette list if live feed fails

### Palette Data Model

```csharp
public class ThemePaletteDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<string> Colors { get; set; } = new();
    public string SourceUrl { get; set; } = string.Empty;
}
```

### Fallback Palettes

```csharp
private static List<ThemePaletteDto> GetFallbackPalettes()
{
    return new List<ThemePaletteDto>
    {
        new() { 
            Id = "264653-2a9d8f-e9c46a-f4a261-e76f51", 
            Name = "Coolors Terra", 
            Colors = new() { "#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51" }, 
            SourceUrl = "https://coolors.co/palette/264653-2a9d8f-e9c46a-f4a261-e76f51" 
        },
        // ... more palettes
    };
}
```

## Service Registration

### Program.cs

Register required services for palette fetching:

```csharp
// Add dependency injection
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

// Add Razor Pages and MVC
builder.Services.AddRazorPages();
builder.Services.AddControllers();

var app = builder.Build();

app.UseRouting();
app.MapRazorPages();
app.MapControllers();

app.Run();
```

## Client-Side: Razor Page Integration

### Pages/Index.cshtml

The palette picker UI in the navbar:

```razor
<div class="dropdown">
    <button class="btn btn-outline-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
        <i class="fas fa-swatchbook me-1"></i>Palette
    </button>
    <div class="dropdown-menu dropdown-menu-end p-3">
        <label for="paletteSearchInput" class="form-label small mb-1">Search Palettes</label>
        <input id="paletteSearchInput" class="form-control form-control-sm mb-2" type="search" />
        
        <label for="paletteSelect" class="form-label small mb-1">Palette</label>
        <select id="paletteSelect" class="form-select form-select-sm mb-2" size="8"></select>
        
        <div class="d-flex justify-content-between gap-2">
            <button id="applyPaletteBtn" class="btn btn-primary btn-sm">Apply</button>
            <a id="paletteSourceLink" class="small" href="https://coolors.co/palettes/trending" target="_blank">View on Coolors</a>
        </div>
    </div>
</div>
```

### Shared Layout (_Layout.cshtml)

The navbar with palette controls appears in the master layout so it's available on all pages:

```razor
<nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-lg">
    <div class="container-fluid">
        <a class="navbar-brand" asp-page="/Index">
            <i class="fas fa-chart-line me-2"></i>
            <span class="fw-bold">Chart.js Visualizer</span>
        </a>
        
        <!-- Palette dropdown here -->
        
        <button id="toneToggleBtn" class="btn btn-outline-light btn-sm">
            <i class="fas fa-moon me-1"></i>Dark
        </button>
    </div>
</nav>
```

## JavaScript Integration

### wwwroot/js/site.js

The client-side palette picker logic:

```javascript
const paletteState = {
    all: [],
    filtered: []
};

async function loadPalettes() {
    const response = await fetch("/Sandbox/Palettes", { method: "GET" });
    const palettes = await response.json();
    
    paletteState.all = palettes;
    paletteState.filtered = [...palettes];
    return palettes;
}

function applyPalette(palette) {
    if (!palette || !Array.isArray(palette.colors)) return;
    
    const primary = palette.colors[0];
    const secondary = palette.colors[1] ?? palette.colors[0];
    const accent = palette.colors[2] ?? palette.colors[0];
    const surface = palette.colors[3] ?? "#f8f9fa";
    
    setRootVariable("--theme-primary", primary);
    setRootVariable("--theme-secondary", secondary);
    setRootVariable("--theme-accent", accent);
    setRootVariable("--theme-surface", surface);
    setRootVariable("--theme-text-on-primary", getContrastColor(primary));
    
    localStorage.setItem("selectedThemePalette", palette.id);
}

function applyTone(mode) {
    const normalized = mode === "dark" ? "dark" : "light";
    document.body.classList.toggle("theme-dark", normalized === "dark");
    localStorage.setItem("toneMode", normalized);
}

async function initializePalettePicker() {
    const select = document.getElementById("paletteSelect");
    const search = document.getElementById("paletteSearchInput");
    const applyButton = document.getElementById("applyPaletteBtn");
    
    try {
        await loadPalettes();
        
        // Restore from localStorage
        const savedId = localStorage.getItem("selectedThemePalette");
        const initialId = savedId && paletteState.all.some(p => p.id === savedId)
            ? savedId
            : paletteState.all[0]?.id;
        
        renderPaletteOptions(paletteState.filtered, initialId);
        
        // Apply initial palette
        const initialPalette = paletteState.all.find(p => p.id === initialId);
        if (initialPalette) {
            applyPalette(initialPalette);
        }
        
        // Wire up event handlers
        search.addEventListener("input", (event) => {
            filterPalettes(event.target.value);
            renderPaletteOptions(paletteState.filtered, select.value);
        });
        
        applyButton.addEventListener("click", applySelectedPalette);
    } catch (error) {
        console.error("Failed to initialize palette picker:", error);
    }
}

document.addEventListener("DOMContentLoaded", initializePalettePicker);
```

## CSS Theming System

### wwwroot/css/site.css

Define CSS variables that the JavaScript updates:

```css
:root {
    --theme-primary: #0d6efd;
    --theme-secondary: #0b5ed7;
    --theme-accent: #6ea8fe;
    --theme-surface: #f8f9fa;
    --theme-text-on-primary: #ffffff;
}

/* Use variables in navbar */
.navbar.bg-primary {
    background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
}

/* Dark mode overrides */
body.theme-dark {
    --theme-surface: #1a1a1a;
    --theme-text: #e0e0e0;
    background-color: var(--theme-surface);
    color: var(--theme-text);
}

/* Charts use CSS variables for colors */
#barChart {
    border-color: var(--theme-primary);
}
```

## Implementing in Your .NET Project

### Step 1: Create the Palette Endpoint

```csharp
[ApiController]
[Route("api/[controller]")]
public class PalettesController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        var palettes = new List<PaletteDto>
        {
            new() { Id = "palette-1", Name = "Blue", Colors = new() { "#0d6efd", "#0b5ed7", "#6ea8fe" } },
            new() { Id = "palette-2", Name = "Green", Colors = new() { "#198754", "#13b85c", "#6c757d" } }
        };
        
        return Ok(palettes);
    }
}
```

### Step 2: Add Palette Controls to Layout

```razor
<!-- In _Layout.cshtml navbar -->
<div class="dropdown">
    <button class="btn btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
        Palette
    </button>
    <div class="dropdown-menu p-3">
        <input id="paletteSearch" type="search" class="form-control form-control-sm mb-2" placeholder="Search..." />
        <select id="paletteSelect" class="form-select form-select-sm mb-2"></select>
        <button class="btn btn-primary btn-sm" onclick="applySelectedPalette()">Apply</button>
    </div>
</div>
```

### Step 3: Initialize Palette Picker

```javascript
async function initializePalettePicker() {
    const response = await fetch("/api/palettes");
    const palettes = await response.json();
    
    const select = document.getElementById("paletteSelect");
    palettes.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

function applySelectedPalette() {
    const select = document.getElementById("paletteSelect");
    const palette = allPalettes.find(p => p.id === select.value);
    
    document.documentElement.style.setProperty("--theme-primary", palette.colors[0]);
    document.documentElement.style.setProperty("--theme-secondary", palette.colors[1]);
    localStorage.setItem("selectedPalette", palette.id);
}

document.addEventListener("DOMContentLoaded", initializePalettePicker);
```

## Key Differences: Static vs .NET

| Aspect | Static HTML | ASP.NET Core |
|--------|-------------|--------------|
| **Palette Source** | `./data/palettes.json` (local file) | `GET /Sandbox/Palettes` (controller endpoint) |
| **Caching** | Browser cache | 6-hour memory cache + browser cache |
| **Live Feeds** | Not supported | Can fetch from live sources (Coolors API) |
| **Data Fetching** | `fetch('./data/palettes.json')` | `fetch('/Sandbox/Palettes')` |
| **Deployment** | GitHub Pages (automatic) | IIS, Docker, Azure App Service, etc. |
| **Customization** | Simple JSON edit | C# business logic |

## Advanced Topics

### Caching Strategy for .NET

```csharp
public async Task<IActionResult> Palettes()
{
    // Cache key
    const string CacheKey = "palettes_cache";
    
    // Try to get from cache
    if (_cache.TryGetValue(CacheKey, out List<PaletteDto>? cached))
    {
        return Json(cached);
    }
    
    // Fetch and cache
    var palettes = await FetchPaletteDataAsync();
    _cache.Set(CacheKey, palettes, TimeSpan.FromHours(6));
    
    return Json(palettes);
}
```

### Dependency Injection Pattern

```csharp
public class PaletteService
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    
    public PaletteService(HttpClient httpClient, IMemoryCache cache)
    {
        _httpClient = httpClient;
        _cache = cache;
    }
    
    public async Task<List<PaletteDto>> GetPalettesAsync()
    {
        // Implementation
    }
}

// Register in Program.cs
builder.Services.AddScoped<PaletteService>();
```

### Error Handling

```javascript
async function loadPalettes() {
    try {
        const response = await fetch("/api/palettes");
        if (!response.ok) throw new Error("Failed to load palettes");
        
        return await response.json();
    } catch (error) {
        console.error("Palette loading error:", error);
        // Use fallback palettes
        return getFallbackPalettes();
    }
}
```

## Testing the Implementation

### Unit Test Example

```csharp
[TestClass]
public class PaletteControllerTests
{
    [TestMethod]
    public async Task Palettes_ReturnsValidJson()
    {
        var controller = new PaletteController(_mockCache, _mockHttp);
        var result = await controller.Palettes();
        
        Assert.IsInstanceOfType(result, typeof(JsonResult));
    }
}
```

### Integration Test

```csharp
[TestClass]
public class PaletteEndpointTests
{
    [TestMethod]
    public async Task GetPalettes_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/palettes");
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }
}
```

## Performance Considerations

1. **Caching**: Always cache palette data to avoid repeated HTTP requests
2. **Pagination**: For large palette collections, implement pagination
3. **Search**: Perform search on the client-side to reduce server load
4. **Bundle Size**: Minimize CSS variables by grouping into themes
5. **Network**: Use gzip compression for JSON responses

## Security Considerations

1. **CORS**: Allow cross-origin access if consuming from different domain
2. **Rate Limiting**: Implement rate limiting on palette endpoint
3. **Validation**: Validate palette data format before caching
4. **XSS Prevention**: Sanitize palette names if they come from user input

## Deployment

### IIS Deployment
```
dotnet publish -c Release
# Copy output to IIS application folder
```

### Docker Deployment
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0
COPY /publish /app
WORKDIR /app
ENTRYPOINT ["dotnet", "app.dll"]
```

### Azure App Service
```bash
dotnet publish -c Release -o ./publish
az webapp deployment source config-zip --resource-group mygroup --name myapp --src publish.zip
```

## Further Reading

- [ASP.NET Core Dependency Injection](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection)
- [Memory Cache in .NET](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.caching.memory)
- [Razor Pages in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/razor-pages)
- [Chart.js Documentation](https://www.chartjs.org/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
