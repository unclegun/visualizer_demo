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
- Embedded Element Style Designer within the CSS Visual Elements pattern page

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

### Tool Integration

- `patterns/css-visual-elements.html#element-style-designer` - embedded designer experience in the static pattern page

### .NET Reference Application

- `examples/razor-reference/visualizer_demo/` - ASP.NET Core Razor Pages implementation sample with pattern implementations and Tag Helper examples

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

## Market Signal Dashboard

A combined daily market intelligence dashboard generated automatically by GitHub Actions from free/public data sources.

**Live dashboard:** https://www.stratastacksolutions.com/visualizer_demo/penny-stock-ranker.html

**Public JSON URLs (for ChatGPT Tasks or other consumers):**
- Summary (ChatGPT-ready): https://www.stratastacksolutions.com/visualizer_demo/data/market-signal-summary.json
- Raw data: https://www.stratastacksolutions.com/visualizer_demo/data/market-signal-raw.json

### What the dashboard does

- Fetches free delayed stock data (Stooq, Yahoo Finance fallback) for a curated penny-stock universe.
- Fetches public prediction market data from Kalshi and Polymarket (open/active markets only).
- Scores each penny stock across momentum, liquidity, and risk sub-scores.
- Scores each prediction market across probability movement, liquidity, and volume.
- Computes a combined market bias score (Risk-On / Neutral / Risk-Off) and a recommended action for the day.
- Writes three JSON files:
  - `data/market-signal-summary.json` – concise, ChatGPT-consumable summary
  - `data/market-signal-raw.json` – full normalised raw data
  - `data/market-signal-history/YYYY-MM-DD.json` – immutable daily snapshot
- Renders a clean, dark, responsive dashboard at `penny-stock-ranker.html`.

### How GitHub Actions generates the files

The workflow `.github/workflows/market-signals.yml` runs on a weekday schedule (07:23 UTC):

1. Checks out the repository.
2. Runs `scripts/market_signals/generate_market_signals.py` with Python 3.12.
3. Commits the updated JSON files back to the repository.
4. GitHub Pages automatically re-deploys on the next push.

### How to manually run the workflow

1. Go to **Actions → Market Signal Dashboard – Daily Update** in the GitHub repository.
2. Click **Run workflow**.
3. Optionally adjust `MAX_TICKERS`, `PRICE_MIN`, `PRICE_MAX`, `TOP_N_STOCKS`, `TOP_N_MARKETS`.
4. Click **Run workflow**.

### How to edit the ticker universe

Edit `data/tickers.json` (or `penny-stock-watchlist/data/tickers.json` as fallback).
The file should be:

```json
{
  "tickers": ["MARA", "RIOT", "SOUN", "..."]
}
```

If this file is missing, the generator uses a hard-coded fallback list in
`scripts/market_signals/universe.py`.

### How scoring works

**Penny stock scoring (0–100):**
- Momentum score (0–30): 1-day change, 5/20-day trend slope, SMA cross, RSI, 5d/20d change
- Liquidity score (0–30): absolute volume, relative volume (vs 20-day avg), average volume quality
- Risk score (0–30): price range sweet-spot, annualised volatility, RSI positioning
- Bonus/penalty (−40 to +10): gap-up bonus, missing data penalty

**Prediction market scoring (0–100):**
- Probability in actionable range (15–85%): up to 15 pts
- Probability movement (absolute change): up to 25 pts
- Liquidity (open interest): up to 20 pts
- Volume: up to 20 pts
- Stale/no movement: −5 pt penalty
- Illiquid: −10 pt penalty

**Combined market bias (0–100):**
- 60% weight on average penny stock score
- 40% weight on average prediction market score
- ≥65 → Risk-On · 45–64 → Neutral · <45 → Risk-Off

### Limitations of free/delayed data

- Stooq and Yahoo Finance data is typically delayed 15–20 minutes during market hours.
- Prediction market data reflects public API snapshots at generation time.
- Scores are deterministic rule-based signals, not predictive models.
- A high score does not guarantee a profitable trade.
- No live trading, no brokerage integration, no paid APIs.
- **This is for educational and research purposes only. Not financial advice.**

---

## Roadmap

- Add server-rendered examples for optimistic concurrency + row-level updates.
- Expand HTMX anti-forgery and validation-failure examples.
- Add accessibility-focused pattern variants and keyboard interaction notes.
- Add more conventions around testability and handler-level unit testing.
