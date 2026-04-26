"""
universe.py – Ticker universe management for the market signals generator.

Loads the candidate penny-stock ticker list from:
  1. Local data/tickers.json (preferred)
  2. Hard-coded fallback list

The fallback list intentionally covers a broad range of active penny-stock names
that commonly appear in screeners.
"""

import json
import logging
import os
from typing import List

logger = logging.getLogger(__name__)


def load_ticker_universe(tickers_json_path: str) -> List[str]:
    """Load the candidate ticker list from the local JSON file.

    Falls back to a small hard-coded list if the file is absent or malformed.
    """
    try:
        if os.path.exists(tickers_json_path):
            with open(tickers_json_path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            tickers = data.get("tickers", [])
            if tickers:
                logger.info("Loaded %d tickers from %s", len(tickers), tickers_json_path)
                return [str(t).upper().strip() for t in tickers if t]
    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning("Could not load ticker universe from file: %s", exc)

    # Try penny-stock-watchlist sibling location
    alt_path = os.path.join(
        os.path.dirname(tickers_json_path), "..", "penny-stock-watchlist", "data", "tickers.json"
    )
    alt_path = os.path.abspath(alt_path)
    try:
        if os.path.exists(alt_path):
            with open(alt_path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            tickers = data.get("tickers", [])
            if tickers:
                logger.info("Loaded %d tickers from alt path %s", len(tickers), alt_path)
                return [str(t).upper().strip() for t in tickers if t]
    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning("Could not load alt ticker universe: %s", exc)

    logger.warning("Using hard-coded fallback ticker list.")
    return _FALLBACK_TICKERS


# Broad fallback list covering commonly active penny stocks across sectors
_FALLBACK_TICKERS: List[str] = [
    # Crypto miners / blockchain
    "MARA", "RIOT", "CLSK", "HUT", "BTBT", "CIFR", "ARBK",
    # EVs / mobility
    "FFIE", "MULN", "NKLA", "GOEV", "WKHS",
    # Biotech / health
    "GOVX", "BNGO", "IMPP", "SIDU",
    # Tech
    "SOUN", "IDEX", "VNET",
    # Misc small-caps
    "SHIP", "CNEY",
    # Additional active names
    "MVIS", "NAKD", "BBIG", "EXPR", "AMC",
    "SPCE", "NNDM", "CLOV", "OPEN", "WISH",
    "GFAI", "ILUS", "DPLS", "CETX", "XBIO",
]
