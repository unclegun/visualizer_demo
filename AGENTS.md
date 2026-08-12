# Repository Guidelines

## Project Structure & Module Organization

The repository root is a static GitHub Pages site. Entry pages live in `index.html`, `patterns/`, and `docs/`. Shared browser code is organized by responsibility under `assets/js/` (`core/`, `components/`, `patterns/`, `charts/`, and `theme/`); matching styles live in `assets/css/`. Keep third-party, minified files in `assets/vendor/` and project-owned images or JSON in `assets/img/` and `assets/data/`.

The ASP.NET Core Razor Pages reference is in `examples/razor-reference/visualizer_demo/` and targets .NET 10. Market-data generators live in `scripts/market_signals/` and `penny-stock-watchlist/scripts/`; their generated JSON belongs under the corresponding `data/` and `history/` directories.

## Build, Test, and Development Commands

- `python -m http.server 8000` serves the complete static site at `http://localhost:8000`.
- `dotnet build examples/razor-reference/visualizer_demo.sln` restores and builds the Razor reference app.
- `dotnet run --project examples/razor-reference/visualizer_demo/visualizer_demo.csproj` runs that app locally.
- `python scripts/market_signals/generate_market_signals.py` regenerates the combined market dashboard data.
- `python penny-stock-watchlist/scripts/generate_recommendations.py` refreshes watchlist recommendations. Install `requests` first; these commands access public data services and update tracked JSON.

## Coding Style & Naming Conventions

Follow the existing four-space indentation in Python and two-space indentation in HTML, CSS, and JavaScript. Use ES modules, `camelCase` for JavaScript identifiers, `snake_case` for Python, and `PascalCase` for C# types and Razor Page models. Name pattern files in kebab case, such as `focus-pull-hero.js`, and place related CSS in the equivalent `assets/css/patterns/` file. Prefer small, dependency-light modules and reuse Bootstrap variables and shared theme tokens.

## Testing Guidelines

No automated test suite or coverage threshold is currently committed. Before submitting, build the solution and serve the static site. Exercise every changed page at desktop and mobile widths, check the browser console, verify navigation and theme behavior, and confirm JSON-driven views load over HTTP. For generator changes, inspect both the current output and the dated history snapshot; do not treat generated financial signals as verified advice.

## Commit & Pull Request Guidelines

History generally follows concise Conventional Commit subjects, for example `feat: add focus-pull hero pattern`, `refactor: address code review feedback`, and automated `chore(data): update ...` commits. Keep each commit focused and use an imperative summary. Pull requests should explain the user-visible change, list validation performed, link relevant issues, and include screenshots or a short recording for visual or responsive changes. Call out regenerated data and avoid mixing unrelated generated-file churn with feature work.
