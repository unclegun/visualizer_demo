# Razor UI Patterns

Static demos and ASP.NET Core Razor Pages implementation references.

This repository is a pattern-first reference site for modern UI implementation in Razor Pages. It is intentionally organized as a static GitHub Pages site with practical architecture guidance and copy-paste snippets.

Live demo: https://unclegun.github.io/visualizer_demo

## What This Site Covers

- Chart.js dashboard patterns
- DataTable + modal workflows
- HTMX patterns for partial updates in Razor Pages
- Theme and palette system patterns
- Reusable snippets and conventions
- Razor Pages implementation mapping

## Repository Story

The repository name remains `visualizer_demo` for continuity, but the site/product identity is now Razor UI Patterns.

The old single-purpose framing was retired because the project now spans multiple reusable pattern categories and implementation guidance areas.

## Architecture

```text
/
├── index.html
├── patterns/
│   ├── chartjs-dashboard.html
│   ├── datatable-modal.html
│   ├── htmx-partials.html
│   ├── htmx-modal-form.html
│   ├── htmx-cascading-selects.html
│   └── htmx-table-refresh.html
├── docs/
│   ├── getting-started.html
│   ├── conventions.html
│   ├── razor-pages-mapping.html
│   ├── snippets.html
│   ├── snippets/
│   └── tag-helpers.md
├── assets/
│   ├── css/
│   ├── js/
│   ├── data/
│   └── vendor/
├── examples/
│   └── razor-reference/
│       ├── visualizer_demo/
│       ├── visualizer_demo.sln
│       ├── Dockerfile
│       └── docker-compose.yml
├── DOTNET_REFERENCE.md
└── README.md
```

## Local Development

Run as a static site:

```bash
python -m http.server 8000
# or
npx http-server .
```

Then open http://localhost:8000.

## How Static Patterns Map To Razor Pages

- Static pattern pages show interaction design and fragment boundaries.
- Razor Pages owns routes and handlers.
- Partials own HTML fragment rendering.
- HTMX owns partial transport and swap behavior.
- Bootstrap owns visual primitives.
- Small JavaScript modules handle only local interaction gaps.

Detailed guidance: `docs/razor-pages-mapping.html` and `DOTNET_REFERENCE.md`.

## Notes On Hosting And .NET Examples

- The pattern site itself is static and GitHub Pages friendly.
- The full .NET reference application remains available under `examples/razor-reference/`.
- That reference app can be deployed separately to ASP.NET-compatible hosting.

## Roadmap

- Add server-rendered examples for optimistic concurrency + row-level updates.
- Expand HTMX anti-forgery and validation-failure examples.
- Add accessibility-focused pattern variants and keyboard interaction notes.
- Add more conventions around testability and handler-level unit testing.
