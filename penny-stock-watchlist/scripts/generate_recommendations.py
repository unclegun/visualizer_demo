"""
generate_recommendations.py – Entry point for the daily watchlist generator.

Usage:
    python scripts/generate_recommendations.py

Outputs:
    data/recommendations.json       – current ranked watchlist
    data/history/YYYY-MM-DD.json    – immutable daily snapshot

Environment variables (optional):
    MAX_TICKERS   – cap on tickers to process (default 50)
    PRICE_MIN     – minimum price filter (default 0.10)
    PRICE_MAX     – maximum price filter (default 5.00)
"""

import logging
import os
import sys

# Ensure scripts/ directory is on the path so sibling modules resolve
sys.path.insert(0, os.path.dirname(__file__))

from scanner import scan_tickers
from utils import DISCLAIMER, last_business_date, save_json, setup_logging, utc_now_iso

logger = logging.getLogger(__name__)


def main() -> None:
    setup_logging()

    # Paths (relative to repo root, or override via env)
    repo_root = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..")
    )
    tickers_path = os.path.join(repo_root, "data", "tickers.json")
    output_path = os.path.join(repo_root, "data", "recommendations.json")
    history_dir = os.path.join(repo_root, "data", "history")

    max_tickers = int(os.environ.get("MAX_TICKERS", "50"))
    price_min = float(os.environ.get("PRICE_MIN", "0.10"))
    price_max = float(os.environ.get("PRICE_MAX", "5.00"))

    logger.info("=== Penny-Stock Watchlist Generator ===")
    logger.info("Repo root  : %s", repo_root)
    logger.info("Tickers    : %s", tickers_path)
    logger.info("Output     : %s", output_path)
    logger.info("Max tickers: %d  price range: $%.2f – $%.2f", max_tickers, price_min, price_max)

    recommendations = scan_tickers(
        tickers_json_path=tickers_path,
        max_tickers=max_tickers,
        price_min=price_min,
        price_max=price_max,
    )

    market_date = last_business_date()
    generated_at = utc_now_iso()

    # Determine the most common marketDate from scored rows (use last-business-day
    # as fallback when all tickers are skipped)
    if recommendations:
        dates = [r.get("marketDate", market_date) for r in recommendations]
        market_date = max(set(dates), key=dates.count)

    output = {
        "generatedAt": generated_at,
        "marketDate": market_date,
        "disclaimer": DISCLAIMER,
        "recommendations": recommendations,
    }

    # Write current recommendations
    save_json(output_path, output)
    logger.info("Wrote %d recommendations → %s", len(recommendations), output_path)

    # Write history snapshot (one file per market date)
    history_path = os.path.join(history_dir, f"{market_date}.json")
    if not os.path.exists(history_path):
        save_json(history_path, output)
        logger.info("Wrote history snapshot → %s", history_path)
    else:
        logger.info("History snapshot already exists for %s, skipping.", market_date)

    logger.info("Done.")


if __name__ == "__main__":
    main()
