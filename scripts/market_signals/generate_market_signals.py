"""
generate_market_signals.py – Entry point for the daily market signal generator.

Usage:
    python scripts/market_signals/generate_market_signals.py

Outputs:
    data/market-signal-summary.json   – concise, ChatGPT-ready summary
    data/market-signal-raw.json       – full normalised raw data
    data/market-signal-history/YYYY-MM-DD.json  – daily snapshot

Environment variables (optional):
    MAX_TICKERS   – cap on tickers to process (default: 50)
    PRICE_MIN     – minimum penny-stock price filter (default: 0.10)
    PRICE_MAX     – maximum penny-stock price filter (default: 5.00)
    TOP_N_STOCKS  – top N penny stocks to include in summary (default: 10)
    TOP_N_MARKETS – top N prediction markets to include in summary (default: 10)
"""

import logging
import os
import sys

# Ensure this directory is on the path so sibling modules resolve
sys.path.insert(0, os.path.dirname(__file__))

from penny_stock_sources import fetch_price_history
from prediction_market_sources import fetch_all_prediction_markets, filter_relevant_markets
from scoring import compute_combined_signals, score_penny_stock, score_prediction_market
from universe import load_ticker_universe
from utils import last_business_date, save_json, setup_logging, today_str, utc_now_iso

logger = logging.getLogger(__name__)

SOURCE_NOTE = (
    "Generated from free/public delayed data sources. "
    "Verify all data before acting. Not financial advice."
)
CHATGPT_INSTRUCTIONS = {
    "primaryQuestion": "Based only on this file, what is the best move today?",
    "requiredOutput": [
        "Best overall move",
        "Top 3 penny stock candidates",
        "Top 3 prediction market opportunities",
        "What to avoid",
        "Manual verification checklist",
    ],
}


def _scan_penny_stocks(
    tickers: list,
    price_min: float,
    price_max: float,
    max_tickers: int,
) -> tuple:
    """Fetch and score penny stocks. Returns (scored_list, raw_dict)."""
    tickers = tickers[:max_tickers]
    scored = []
    raw_data = {}

    for ticker in tickers:
        logger.info("Fetching %s …", ticker)
        try:
            history = fetch_price_history(ticker)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Fetch error for %s: %s", ticker, exc)
            history = None

        if not history:
            logger.debug("No history for %s, skipping.", ticker)
            continue

        # Price filter
        latest_close = history[-1].get("close", 0)
        if not (price_min <= latest_close <= price_max):
            logger.debug(
                "%s price $%.4f outside range $%.2f–$%.2f, skipping.",
                ticker, latest_close, price_min, price_max,
            )
            continue

        raw_data[ticker] = {
            "historyRows": len(history),
            "latestDate":  history[-1]["date"],
            "latestClose": latest_close,
        }

        try:
            record = score_penny_stock(ticker, history)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Scoring error for %s: %s", ticker, exc)
            record = None

        if record:
            scored.append(record)

    # Sort by score descending and add rank
    scored.sort(key=lambda r: r["score"], reverse=True)
    for i, rec in enumerate(scored):
        rec["rank"] = i + 1

    return scored, raw_data


def _score_prediction_markets(markets_by_platform: dict, top_n: int) -> tuple:
    """Score all fetched prediction markets. Returns (scored_list, raw_dict)."""
    all_markets = []
    for platform, markets in markets_by_platform.items():
        all_markets.extend(markets)

    relevant = filter_relevant_markets(all_markets, top_n=top_n * 3)

    scored = []
    for m in relevant:
        try:
            scored_m = score_prediction_market(m)
        except Exception as exc:  # noqa: BLE001
            logger.warning("PM scoring error: %s", exc)
            continue
        scored.append(scored_m)

    scored.sort(key=lambda m: m["score"], reverse=True)
    for i, m in enumerate(scored):
        m["rank"] = i + 1

    raw = {
        platform: [
            {k: v for k, v in m.items() if k != "_raw"}
            for m in markets
        ]
        for platform, markets in markets_by_platform.items()
    }
    return scored[:top_n], raw


def main() -> None:
    setup_logging()

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    tickers_path = os.path.join(repo_root, "data", "tickers.json")
    summary_path = os.path.join(repo_root, "data", "market-signal-summary.json")
    raw_path = os.path.join(repo_root, "data", "market-signal-raw.json")
    history_dir = os.path.join(repo_root, "data", "market-signal-history")

    max_tickers = int(os.environ.get("MAX_TICKERS", "50"))
    price_min = float(os.environ.get("PRICE_MIN", "0.10"))
    price_max = float(os.environ.get("PRICE_MAX", "5.00"))
    top_n_stocks = int(os.environ.get("TOP_N_STOCKS", "10"))
    top_n_markets = int(os.environ.get("TOP_N_MARKETS", "10"))

    logger.info("=== Market Signal Generator ===")
    logger.info("Repo root : %s", repo_root)
    logger.info("Max tickers: %d  price $%.2f–$%.2f", max_tickers, price_min, price_max)

    generated_at = utc_now_iso()
    market_date = last_business_date()

    # ---- 1. Penny stocks ----
    logger.info("--- Scanning penny stocks ---")
    ticker_universe = load_ticker_universe(tickers_path)
    scored_stocks, raw_stocks = _scan_penny_stocks(
        ticker_universe, price_min, price_max, max_tickers
    )
    logger.info("Scored %d penny stock candidates.", len(scored_stocks))

    # ---- 2. Prediction markets ----
    logger.info("--- Fetching prediction markets ---")
    markets_by_platform = fetch_all_prediction_markets()
    scored_markets, raw_markets = _score_prediction_markets(markets_by_platform, top_n_markets)
    logger.info("Scored %d prediction market candidates.", len(scored_markets))

    # ---- 3. Combined signals ----
    market_bias, best_move, combined_signals = compute_combined_signals(
        scored_stocks[:top_n_stocks],
        scored_markets,
    )

    # ---- 4. Build output files ----

    # Strip _raw from prediction market records before writing
    def _clean_pm(m: dict) -> dict:
        return {k: v for k, v in m.items() if k != "_raw"}

    top_stocks_clean = scored_stocks[:top_n_stocks]
    top_markets_clean = [_clean_pm(m) for m in scored_markets]

    summary = {
        "generatedAt":         generated_at,
        "marketDate":          market_date,
        "sourceNote":          SOURCE_NOTE,
        "marketBias":          market_bias,
        "bestMove":            best_move,
        "topPennyStocks":      top_stocks_clean,
        "topPredictionMarkets": top_markets_clean,
        "combinedSignals":     combined_signals,
        "chatGptInstructions": CHATGPT_INSTRUCTIONS,
    }

    raw_output = {
        "generatedAt":   generated_at,
        "marketDate":    market_date,
        "sourceNote":    SOURCE_NOTE,
        "pennyStocks":   {
            "universe":  ticker_universe,
            "scored":    scored_stocks,
            "rawByTicker": raw_stocks,
        },
        "predictionMarkets": {
            "rawByPlatform": raw_markets,
            "scored":        [_clean_pm(m) for m in scored_markets],
        },
    }

    save_json(summary_path, summary)
    logger.info("Wrote summary → %s", summary_path)

    save_json(raw_path, raw_output)
    logger.info("Wrote raw    → %s", raw_path)

    # History snapshot
    history_path = os.path.join(history_dir, f"{market_date}.json")
    if not os.path.exists(history_path):
        save_json(history_path, summary)
        logger.info("Wrote history snapshot → %s", history_path)
    else:
        logger.info("History snapshot already exists for %s, skipping.", market_date)

    logger.info("=== Done. ===")


if __name__ == "__main__":
    main()
