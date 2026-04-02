# ASP.NET Core Reference Mapping

This repository is primarily a static pattern library site, but it includes a full ASP.NET Core Razor Pages reference application under `examples/razor-reference/`.

## Purpose

Use the reference app when you want concrete implementation examples behind the static patterns documented in:

- `patterns/`
- `docs/razor-pages-mapping.html`

## Reference App Location

```text
examples/razor-reference/
├── visualizer_demo/
├── visualizer_demo.sln
├── Dockerfile
└── docker-compose.yml
```

## Architectural Mapping

- Razor Pages handles routes, handlers, validation, and model binding.
- Partial views render fragment HTML.
- HTMX requests transport fragments and swap content into target regions.
- Bootstrap provides the visual primitive layer.
- Focused JavaScript modules provide optional enhancements.

## Why Explicit Partials

The reference app favors explicit Razor partials for forms and modal bodies because this keeps validation, security, and field intent obvious in production workflows.

## Suggested Next Steps In The Reference App

1. Add dedicated handlers for each HTMX pattern flow.
2. Keep anti-forgery token handling explicit for all `hx-post` forms.
3. Add focused integration tests for partial handlers and validation branches.
4. Keep front-end behavior modular, avoiding monolithic client scripts.
