# Penny-Stock Watchlist

> **⚠️ NOT FINANCIAL ADVICE.** This project is for **educational and research purposes only**.
> Penny stocks are highly speculative. Most retail traders lose money. Never trade based solely
> on automated signals. Always do your own research and consult a licensed financial advisor.

A free, static penny-stock research dashboard that runs daily through GitHub Actions and publishes
a ranked watchlist to GitHub Pages. No paid APIs. No backend server. No live trading.

🔗 **Live demo:** [https://unclegun.github.io/visualizer_demo/penny-stock-watchlist/](https://unclegun.github.io/visualizer_demo/penny-stock-watchlist/)

---

## Table of Contents

1. [Project Purpose](#project-purpose)
2. [Free Data Source Limitations](#free-data-source-limitations)
3. [Project Structure](#project-structure)
4. [Setup Instructions](#setup-instructions)
5. [GitHub Pages Setup](#github-pages-setup)
6. [GitHub Actions Setup](#github-actions-setup)
7. [How to Edit the Ticker Universe](#how-to-edit-the-ticker-universe)
8. [How Scoring Works](#how-scoring-works)
9. [Risk Disclaimer](#risk-disclaimer)
10. [Future Improvements](#future-improvements)

---

## Project Purpose

This project generates a daily ranked watchlist of low-priced listed stocks (typically $0.10–$5.00)
using only free, publicly available data sources. It is intended to:

- Demonstrate how to build a fully static, GitHub Pages-hosted data dashboard.
- Show how GitHub Actions can automate daily data pipelines at zero cost.
- Serve as an educational starting point for learning technical analysis concepts.
- Provide a research canvas for manual due diligence — never a replacement for it.

**What it does NOT do:**
- Place orders or interact with any brokerage.
- Provide real-time data.
- Guarantee profitable trades.
- Constitute licensed financial advice.

---

## Free Data Source Limitations

| Source | What it provides | Known limits |
|--------|-----------------|--------------|
| **Stooq** (`stooq.com`) | Daily OHLCV history | ~15-min delay; rate-limit after many requests |
| **Yahoo Finance** (unofficial) | Daily OHLCV (fallback) | May throttle or block; unofficial API |
| **Local `data/tickers.json`** | Configurable candidate universe | Manually maintained |

Because free data may be **delayed 15–20 minutes or more**, bid/ask spread data is not available.
The `entryZone`, `stopLoss`, and `target` fields are **estimates** based on volatility proxies,
not live order-book data.

---

## Project Structure

```
penny-stock-watchlist/
├── index.html                    # Dashboard frontend
├── app.js                        # Vanilla JS: filters, sort, rendering
├── styles.css                    # Dark responsive styles
├── README.md                     # This file
├── data/
│   ├── tickers.json              # Configurable ticker universe (edit this!)
│   ├── recommendations.json      # Daily output (auto-generated)
│   └── history/                  # Immutable daily snapshots (YYYY-MM-DD.json)
└── scripts/
    ├── generate_recommendations.py  # Entry point
    ├── scanner.py                   # Orchestration loop
    ├── scoring.py                   # Deterministic scoring model
    ├── data_sources.py              # Free data fetchers (Stooq / Yahoo)
    ├── indicators.py                # RSI, SMA, EMA, volatility, trend
    └── utils.py                     # Shared helpers
```

The GitHub Action lives at `.github/workflows/daily-recommendations.yml` (repository root).

---

## Setup Instructions

### Prerequisites

- Python 3.12+
- `requests` package (`pip install requests`)

### Run locally

```bash
cd penny-stock-watchlist
pip install requests
python scripts/generate_recommendations.py
```

The script writes `data/recommendations.json` and `data/history/YYYY-MM-DD.json`.

Open `index.html` in a browser (or serve with `python -m http.server`) to view results.

> **Note:** Browser security policies block `fetch()` from `file://` URLs.
> Use a local HTTP server:
> ```bash
> python -m http.server 8080
> # then open http://localhost:8080/penny-stock-watchlist/
> ```

### Environment variables (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_TICKERS` | `50` | Cap on tickers scanned per run |
| `PRICE_MIN` | `0.10` | Minimum price filter (USD) |
| `PRICE_MAX` | `5.00` | Maximum price filter (USD) |

---

## GitHub Pages Setup

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to `Deploy from a branch`, branch `main`, folder `/` (root).
4. GitHub Pages will serve the entire repository. Navigate to
   `https://<username>.github.io/<repo>/penny-stock-watchlist/` to view the dashboard.

Alternatively, the existing `build-and-deploy.yml` workflow already deploys the entire repo root
to Pages — the `penny-stock-watchlist/` subdirectory will be accessible automatically.

---

## GitHub Actions Setup

The workflow at `.github/workflows/daily-recommendations.yml`:

- **Triggers:** Every weekday at 07:30 UTC (`cron: "30 7 * * 1-5"`) and on manual dispatch.
- **Steps:**
  1. Checks out the repository.
  2. Sets up Python 3.12.
  3. Installs `requests`.
  4. Runs `penny-stock-watchlist/scripts/generate_recommendations.py`.
  5. Commits and pushes `data/recommendations.json` and any new history snapshots.

### Permissions required

The workflow needs `contents: write` to commit back to the repository. This is already configured
in the workflow file. No secrets are required.

### Manual trigger

Go to **Actions → Daily Penny-Stock Watchlist → Run workflow** in the GitHub UI.
You can override `max_tickers`, `price_min`, and `price_max` inputs.

---

## How to Edit the Ticker Universe

Edit `data/tickers.json`:

```json
{
  "version": "1.0.0",
  "updatedAt": "2025-01-01",
  "tickers": [
    "SOUN", "MARA", "RIOT", "CLSK"
  ]
}
```

Guidelines:
- Use NYSE/NASDAQ/AMEX-listed tickers only (OTC tickers are harder to get data for).
- Keep prices generally in the $0.10–$5.00 range for penny-stock signals.
- Aim for 30–60 tickers to keep the daily run time under 5 minutes.
- Stooq requires a `.US` suffix internally — the scripts handle this automatically.

---

## How Scoring Works

Each ticker receives a score from **0 to 100** based on three sub-scores plus bonuses/penalties:

### Momentum Score (0–30)

| Signal | Points |
|--------|--------|
| Day change ≥ 10% | +8 |
| Day change 5–10% | +6 |
| Day change 2–5% | +4 |
| Positive 5-day slope | +2 to +8 |
| Positive 20-day slope | +3 to +6 |
| Price above SMA-5 | +4 |
| Price above SMA-20 | +4 |
| RSI in 45–65 range | +4 |
| Negative day / overbought RSI | penalty |

### Liquidity Score (0–30)

| Signal | Points |
|--------|--------|
| Volume ≥ 5M | +12 |
| Volume ≥ 2M | +9 |
| Volume ≥ 500K | +5 |
| Relative volume ≥ 5× | +12 |
| Relative volume ≥ 2× | +8 |
| Average volume ≥ 2M | +6 |
| Very low volume | penalty |

### Risk Score (0–30, higher = better risk profile)

| Signal | Points |
|--------|--------|
| Price in $0.50–$5.00 | +5 |
| Low annualised volatility | +2 to +5 |
| Oversold RSI | +3 |
| Extreme volatility (>150%) | -8 |
| Sub-$0.50 price | -5 |
| Overbought RSI | -4 |

### Bonuses / Penalties

| Condition | Adjustment |
|-----------|-----------|
| Positive opening gap > 2% | +5 |
| Negative gap < -3% | -5 |
| Per missing data field | -2 (max -20) |

> **TODO (future):** Include bid/ask spread as a penalty when real-time data is available.

---

## Risk Disclaimer

```
THIS IS NOT FINANCIAL ADVICE.

All data may be delayed. Penny stocks are highly speculative and most retail traders
lose money trading them. This tool is for educational and research purposes only.
Do not make trading decisions based solely on this data. Past performance of any
scoring model is not indicative of future results.

Always do your own research and consult a licensed financial advisor before investing.
```

---

## Future Improvements

The following are planned enhancements — contributions welcome:

- [ ] **Alpaca paper trading integration** – simulate trades without real money to backtest the scoring model.
- [ ] **Better real-time data** – integrate with free WebSocket sources (e.g., Alpaca free tier, Polygon.io free tier) for more timely signals.
- [ ] **Sentiment analysis** – scrape Reddit (r/pennystocks, r/WallStreetBets) or news headlines using free NLP libraries.
- [ ] **SEC filing catalyst detection** – parse SEC EDGAR 8-K filings for material events (earnings, M&A rumours, shelf registrations).
- [ ] **Dilution risk indicator** – flag tickers with high authorised-vs-outstanding share ratios from SEC data.
- [ ] **Broker account settlement tracker** – manual journal to track T+2 settlement windows.
- [ ] **Manual trade journal** – CSV-backed journal for tracking paper trades and calculating actual P&L.
- [ ] **Backtesting module** – replay historical signals against historical prices to evaluate model accuracy.
- [ ] **Bid/ask spread penalty** – add spread cost estimates when real-time quote data becomes available.
- [ ] **Short interest data** – incorporate free short interest data from FINRA or exchange feeds.
