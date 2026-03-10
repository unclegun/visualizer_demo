# Chart.js Visualizer - Static HTML Demo

A modern, static HTML demonstration of a **Chart.js visualizer** with **dynamic palette picker** and **light/dark theme toggle**. No backend required—runs entirely in the browser with GitHub Pages hosting.

**Live Demo:** [https://unclegun.github.io/visualizer_demo](https://unclegun.github.io/visualizer_demo)

## What Changed

This repository has been converted from an **ASP.NET Core application** to a **static HTML site** that:

✅ **No backend required** - runs as pure HTML/CSS/JavaScript  
✅ **GitHub Pages compatible** - auto-deploys on push to main  
✅ **Works offline** - all palettes and chart data included  
✅ **Maintains .NET reference** - see [DOTNET_REFERENCE.md](./DOTNET_REFERENCE.md) for how to build this in ASP.NET Core  

## Features

- 🎨 **Dynamic Palette Picker** - 10 Coolors-inspired color palettes with search
- 🌗 **Light/Dark Theme Toggle** - CSS variable-driven theming
- 📊 **6 Chart.js Examples** - Bar, Line, Pie, Doughnut, Radar, Polar Area
- 📱 **Responsive Design** - Bootstrap 5 grid adapts to mobile
- 💾 **Local Storage** - persists selected palette and theme
- 🚀 **Zero Dependencies** (except CDN libraries) - no npm build step

## Project Structure

```
visualizer_demo/
├── index.html                    Main static page
├── css/site.css                 Theme variables & styles
├── js/site.js                   Palette picker & UI logic
├── data/
│   ├── palettes.json           Color palette definitions
│   └── charts.json             Chart.js configurations
├── DOTNET_REFERENCE.md         How to build this in .NET
└── README.md                   This file
```

## Getting Started

### Run Locally

Simply open `index.html` in a browser, or serve with a local HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# Ruby
ruby -run -ehttpd . -p8000
```

Then visit: [http://localhost:8000](http://localhost:8000)

### Deploy to GitHub Pages

1. Push to `main` branch
2. GitHub Actions automatically:
   - Builds the site
   - Deploys to GitHub Pages
   - Site is live at `https://YOUR_USERNAME.github.io/visualizer_demo`

## How the Palette System Works

### 1. **Palette Data** (`data/palettes.json`)

```json
[
  {
    "id": "264653-2a9d8f-e9c46a-f4a261-e76f51",
    "name": "Coolors Terra",
    "colors": ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"],
    "sourceUrl": "https://coolors.co/palette/..."
  }
]
```

### 2. **CSS Variables** (`css/site.css`)

```css
:root {
  --theme-primary: #0d6efd;
  --theme-secondary: #0b5ed7;
  --theme-accent: #6ea8fe;
  --theme-surface: #f8f9fa;
  --theme-text-on-primary: #ffffff;
}

body.theme-dark {
  --theme-surface: #1a1a1a;
  --theme-text: #e0e0e0;
}
```

### 3. **Apply Palette** (`js/site.js`)

```javascript
function applyPalette(palette) {
  document.documentElement.style.setProperty('--theme-primary', palette.colors[0]);
  document.documentElement.style.setProperty('--theme-secondary', palette.colors[1]);
  localStorage.setItem('selectedThemePalette', palette.id);
}
```

## Using This as a .NET Reference

See **[DOTNET_REFERENCE.md](./DOTNET_REFERENCE.md)** for detailed examples of how to:

- Create a **Palettes controller endpoint** in ASP.NET Core
- Implement **6-hour memory caching** for palette data
- Fetch palettes from **live sources** (with fallback)
- Use **Razor Pages** to render the same UI
- Add **dependency injection** for services
- Deploy to **IIS, Docker, or Azure**

Key example:

```csharp
[HttpGet]
public async Task<IActionResult> Palettes()
{
    // Fetch from Coolors API or fallback to static list
    var palettes = await TryGetCoolorsTrendingPalettesAsync();
    if (palettes.Count == 0)
        palettes = GetFallbackPalettes();
    
    // Cache for 6 hours
    _memoryCache.Set("palettes", palettes, TimeSpan.FromHours(6));
    return Json(palettes);
}
```

## Customization

### Add a New Palette

Edit `data/palettes.json`:

```json
{
  "id": "my-custom-palette",
  "name": "My Custom Colors",
  "colors": ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFFF33"],
  "sourceUrl": "https://..."
}
```

### Add a New Chart

Edit `data/charts.json` and add a canvas to `index.html`:

```html
<div class="draggable-card chart-type-line" id="card7">
  <div class="card-header">My New Chart</div>
  <div class="card-body">
    <canvas id="chart-myChart"></canvas>
  </div>
</div>
```

### Change Brands

Update in `index.html`:

```html
<a class="navbar-brand" href="#dashboard">
  <i class="fas fa-chart-line me-2"></i>
  <span>My Dashboards</span>  <!-- Change this -->
</a>
```

### Use Deviation Comment Block Snippets

If you intentionally diverge from shared template styles or conventions, use the reusable comment block snippets in:

- `docs/snippets/`

Included shortcuts:

- `devcss` for CSS deviations
- `devjs` for JavaScript deviations
- `devhtml` for HTML/Razor markup deviations
- `devcs` for C# convention deviations

For full instructions on importing snippets, using placeholders, and creating new snippets, see:

- `docs/snippets/README.md`

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox
- **JavaScript ES6+** - Vanilla (no frameworks)
- **Bootstrap 5** - Responsive grid & components
- **Chart.js 4.x** - Data visualization
- **Font Awesome 6** - Icons
- **Prism.js** - Syntax highlighting
- **GitHub Pages** - Free static hosting

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **First Paint:** < 1s
- **Interactive:** < 2s
- **Page Size:** ~150KB (uncompressed)
- **Lighthouse Score:** 95+

## License

MIT - Feel free to use this as a template for your own projects.

## Questions?

See [DOTNET_REFERENCE.md](./DOTNET_REFERENCE.md) for implementation details or check the **Documentation** tab in the live demo.
- `form-group`
- `select-group`
- `checkbox-group`
- `checkbox-list-group`
- `validation-summary-alert`

Full usage guide:

- `docs/tag-helpers.md`

## Local Development

1. Clone the repository
2. Navigate to the visualizer_demo directory
3. Run `dotnet run`
4. Open http://localhost:5062

## Technologies Used

- ASP.NET Core 10.0
- Chart.js 4.x
- Bootstrap 5
- SQLite
- C# 12

## Deployment Options

This application requires server-side processing and cannot be deployed directly to GitHub Pages. Here are several deployment alternatives:

### 1. Azure App Service (Recommended)

**Free Tier Available** - Perfect for demos and small applications

#### Setup Steps:
1. Create an Azure App Service (Web App) with .NET 10 runtime
2. Add your publish profile to GitHub Secrets as `AZUREAPPSERVICE_PUBLISHPROFILE`
3. Update `.github/workflows/azure-deploy.yml` with your app name
4. Push to main branch to trigger automatic deployment

#### Manual Deployment:
```bash
dotnet publish -c Release -o ./publish
# Deploy using Azure CLI or Visual Studio
```

### 2. Docker Deployment

**Containerized deployment for any cloud provider**

#### Local Testing:
```bash
docker-compose up --build
# Access at http://localhost:8080
```

#### Deploy to any container service:
- **Railway**: Connect GitHub repo, auto-deploys
- **Render**: Docker-based hosting
- **Google Cloud Run**: Serverless containers
- **AWS Fargate**: Managed container service

### 3. Heroku Deployment

**Traditional PaaS hosting**

1. Create a Heroku app
2. Add Heroku CLI to your build
3. Use the provided Dockerfile
4. Deploy via git push or GitHub integration

### 4. Railway

**Modern deployment platform**

1. Connect your GitHub repository
2. Railway automatically detects .NET and deploys
3. Database included (can migrate from SQLite)
4. Zero configuration required

### 5. Vercel/Netlify with Serverless Functions

**Advanced option requiring code changes**

Convert to serverless architecture using:
- ASP.NET Core Minimal APIs
- Azure Functions
- AWS Lambda

### 6. Self-Hosted

**For dedicated servers or VPS**

```bash
# Build and run
dotnet publish -c Release
dotnet visualizer_demo.dll --urls "http://0.0.0.0:5000"
```

## Quick Start with Railway (Easiest)

1. Go to [Railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will auto-detect and deploy
4. Get your live URL instantly

## Environment Variables

```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:80
# Add database connection strings as needed
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

MIT License - feel free to use in your projects!
