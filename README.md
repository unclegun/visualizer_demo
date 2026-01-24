# ASP.NET Core Chart.js Visualizer

A comprehensive Chart.js integration demo for ASP.NET Core Razor Pages with drag-and-drop dashboard functionality.

## Features

- 10+ Chart.js chart types (Bar, Line, Pie, Doughnut, Radar, Polar Area, Scatter, etc.)
- Interactive drag-and-drop dashboard
- Responsive design with Bootstrap 5
- SQLite database integration
- Modern web application interface
- Comprehensive documentation and code examples

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
