# Razor UI Patterns

Static demos and ASP.NET Core Razor Pages implementation references.

This repository is a pattern-first reference site for modern UI implementation in Razor Pages. It is intentionally organized as a static GitHub Pages site with practical architecture guidance and copy-paste snippets.

Live demo: https://unclegun.github.io/visualizer_demo

## What This Site Covers

- Chart.js dashboard patterns
- DataTable + modal workflows
- HTMX patterns for partial updates in Razor Pages
- Advanced UI pattern packs (headers, cards, data shells, forms, motion, navigation, visual elements)
- Theme, tone, and palette system patterns
- Reusable snippets and conventions
- Razor Pages implementation mapping
- Tooling references (including LLM context generation)
- Element Style Designer route behavior for static and Razor hosting

## Site Areas (Complete Map)

### Home

- `index.html` - landing page with featured patterns, reference guides, and architecture framing

### Pattern Gallery

- `patterns/chartjs-dashboard.html`
- `patterns/datatable-modal.html`
- `patterns/htmx-partials.html`
- `patterns/htmx-modal-form.html`
- `patterns/htmx-cascading-selects.html`
- `patterns/htmx-table-refresh.html`

### Advanced UI Section

- `patterns/advanced-ui.html` - category entry point
- `patterns/advanced-headers.html`
- `patterns/premium-cards.html`
- `patterns/data-display.html`
- `patterns/forms-filters.html`
- `patterns/dashboard-motion.html`
- `patterns/navigation-layout.html`
- `patterns/microinteractions.html`
- `patterns/css-visual-elements.html`

### Reference Guides

- `docs/getting-started.html`
- `docs/conventions.html`
- `docs/razor-pages-mapping.html`
- `docs/snippets.html`
- `docs/htmx-spike.html`
- `docs/llm-context-generator.html`
- `docs/tag-helpers.md`

### Tool Route and Fallback

- `admin/element-style-designer/index.html` - static fallback for the designer link
- Razor runtime route in reference app: `/admin/element-style-designer`

### .NET Reference Application

- `examples/razor-reference/visualizer_demo/` - ASP.NET Core Razor Pages implementation sample
- Includes the full Razor version of `Pages/Admin/ElementStyleDesigner.cshtml`

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
│   ├── htmx-table-refresh.html
│   ├── advanced-ui.html
│   ├── advanced-headers.html
│   ├── premium-cards.html
│   ├── data-display.html
│   ├── forms-filters.html
│   ├── dashboard-motion.html
│   ├── navigation-layout.html
│   ├── microinteractions.html
│   └── css-visual-elements.html
├── admin/
│   └── element-style-designer/
│       └── index.html
├── docs/
│   ├── getting-started.html
│   ├── conventions.html
│   ├── razor-pages-mapping.html
│   ├── snippets.html
│   ├── htmx-spike.html
│   ├── llm-context-generator.html
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
