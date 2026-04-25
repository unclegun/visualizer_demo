"""
scanner.py – Orchestrates fetching and scoring across the ticker universe.

This module is the main processing loop: for each ticker in the universe it
1. Fetches price history (Stooq → Yahoo fallback)
2. Computes indicators and a deterministic score
3. Returns a sorted list of scored candidates

Tickers that fail data fetch or scoring are logged and skipped gracefully;
they do NOT abort the full run.
"""

import logging
from typing import Any, Dict, List, Optional

from data_sources import fetch_price_history, load_ticker_universe
from scoring import score_ticker

logger = logging.getLogger(__name__)


def scan_tickers(
    tickers_json_path: str,
    max_tickers: int = 50,
    price_min: float = 0.10,
    price_max: float = 5.00,
) -> List[Dict[str, Any]]:
    """Load ticker universe, fetch history, score, and return sorted results.

    Args:
        tickers_json_path: Path to the local tickers.json universe file.
        max_tickers: Cap on the number of tickers to process (controls runtime).
        price_min: Skip tickers whose latest close is below this value.
        price_max: Skip tickers whose latest close is above this value.

    Returns:
        A list of scored dicts sorted descending by "score".
        Only tickers with at least minimal data are included.
    """
    tickers = load_ticker_universe(tickers_json_path)[:max_tickers]
    logger.info("Scanning %d tickers …", len(tickers))

    results: List[Dict[str, Any]] = []
    skipped: List[str] = []

    for i, ticker in enumerate(tickers, 1):
        logger.info("[%d/%d] Processing %s …", i, len(tickers), ticker)
        try:
            history = fetch_price_history(ticker)
            if not history:
                logger.warning("SKIP %s – no price history available", ticker)
                skipped.append(ticker)
                continue

            latest_price = history[-1]["close"]
            if latest_price < price_min or latest_price > price_max:
                logger.info(
                    "SKIP %s – price $%.4f outside filter range [$%.2f, $%.2f]",
                    ticker, latest_price, price_min, price_max,
                )
                skipped.append(ticker)
                continue

            scored = score_ticker(ticker, history)
            if scored is None:
                logger.warning("SKIP %s – could not compute score", ticker)
                skipped.append(ticker)
                continue

            results.append(scored)
            logger.info(
                "  ✓ %s  score=%d  price=%.4f  rvol=%s",
                ticker,
                scored["score"],
                scored["price"],
                f"{scored['relativeVolume']:.2f}" if scored.get("relativeVolume") else "n/a",
            )

        except Exception as exc:  # noqa: BLE001 – never abort for one ticker
            logger.error("ERROR processing %s: %s", ticker, exc, exc_info=True)
            skipped.append(ticker)

    if skipped:
        logger.info("Skipped tickers (%d): %s", len(skipped), ", ".join(skipped))

    # Sort descending by score, then alphabetically as tiebreaker
    results.sort(key=lambda r: (-r["score"], r["ticker"]))

    # Add rank (1-based)
    for rank, rec in enumerate(results, 1):
        rec["rank"] = rank

    logger.info("Scan complete: %d scored, %d skipped.", len(results), len(skipped))
    return results
