"""
prediction_market_sources.py – Free public prediction market data fetchers.

Sources (best-effort, no API key required):
  1. Kalshi public market endpoints
  2. Polymarket CLOB public endpoints

Any source failure is caught and logged; it does not break the full run.
"""

import json
import logging
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from normalizers import normalize_kalshi_market, normalize_polymarket_market

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Kalshi public REST API – no auth required for public market listings
KALSHI_MARKETS_URL = "https://api.elections.kalshi.com/trade-api/v2/markets?limit=100&status=open"
KALSHI_MARKETS_ALT = "https://trading-api.kalshi.com/trade-api/v2/markets?limit=100&status=open"

# Polymarket CLOB public markets
POLYMARKET_MARKETS_URL = (
    "https://clob.polymarket.com/markets?active=true&closed=false&limit=100"
)

_TIMEOUT = 20
_USER_AGENT = (
    "market-signal-dashboard/1.0 "
    "(github.com/educational-project; not-for-trading)"
)

# Categories / keywords to prioritise for relevance to market signals
_FINANCE_KEYWORDS = [
    "stock", "market", "fed", "rate", "inflation", "gdp", "recession",
    "earnings", "ipo", "economy", "dollar", "bitcoin", "crypto", "gold",
    "oil", "energy", "tech", "nasdaq", "s&p", "sp500", "dow",
    "election", "policy", "interest", "fomc", "cpi", "pce",
]


# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------

def _fetch_json(url: str) -> Optional[Any]:
    """GET *url* and parse the response as JSON. Returns None on failure."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": _USER_AGENT,
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            raw = resp.read()
            return json.loads(raw)
    except (urllib.error.URLError, urllib.error.HTTPError, OSError, json.JSONDecodeError) as exc:
        logger.warning("Fetch failed for %s: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# Kalshi
# ---------------------------------------------------------------------------

def fetch_kalshi_markets() -> List[Dict]:
    """Fetch open Kalshi markets.  Returns normalised list, empty on failure."""
    logger.info("Fetching Kalshi markets…")
    data = _fetch_json(KALSHI_MARKETS_URL)
    if data is None:
        logger.info("Trying alternate Kalshi endpoint…")
        time.sleep(1)
        data = _fetch_json(KALSHI_MARKETS_ALT)
    if data is None:
        logger.warning("Kalshi: all endpoints failed, skipping.")
        return []

    # The response is {"markets": [...]} or a list directly
    markets_raw: List[Dict] = []
    if isinstance(data, dict):
        markets_raw = data.get("markets", [])
    elif isinstance(data, list):
        markets_raw = data

    results = []
    for raw in markets_raw:
        norm = normalize_kalshi_market(raw)
        if norm:
            results.append(norm)

    logger.info("Kalshi: %d valid markets fetched.", len(results))
    return results


# ---------------------------------------------------------------------------
# Polymarket
# ---------------------------------------------------------------------------

def fetch_polymarket_markets() -> List[Dict]:
    """Fetch active Polymarket markets.  Returns normalised list, empty on failure."""
    logger.info("Fetching Polymarket markets…")
    data = _fetch_json(POLYMARKET_MARKETS_URL)
    if data is None:
        logger.warning("Polymarket: endpoint failed, skipping.")
        return []

    markets_raw: List[Dict] = []
    if isinstance(data, list):
        markets_raw = data
    elif isinstance(data, dict):
        markets_raw = data.get("data", data.get("markets", []))

    results = []
    for raw in markets_raw:
        norm = normalize_polymarket_market(raw)
        if norm:
            results.append(norm)

    logger.info("Polymarket: %d valid markets fetched.", len(results))
    return results


# ---------------------------------------------------------------------------
# Combined fetch
# ---------------------------------------------------------------------------

def fetch_all_prediction_markets() -> Dict[str, List[Dict]]:
    """Fetch from all sources and return a dict keyed by platform name.

    Each source failure is isolated and returns an empty list.
    """
    results: Dict[str, List[Dict]] = {}

    try:
        results["kalshi"] = fetch_kalshi_markets()
    except Exception as exc:  # noqa: BLE001
        logger.error("Kalshi fetch raised unexpectedly: %s", exc)
        results["kalshi"] = []

    time.sleep(1)

    try:
        results["polymarket"] = fetch_polymarket_markets()
    except Exception as exc:  # noqa: BLE001
        logger.error("Polymarket fetch raised unexpectedly: %s", exc)
        results["polymarket"] = []

    total = sum(len(v) for v in results.values())
    logger.info("Prediction markets total: %d across %d platforms", total, len(results))
    return results


# ---------------------------------------------------------------------------
# Relevance filter
# ---------------------------------------------------------------------------

def filter_relevant_markets(markets: List[Dict], top_n: int = 30) -> List[Dict]:
    """Score and return the most finance-relevant markets from a combined list.

    Markets with finance-related keywords get a relevance boost.
    After keyword filtering, select top_n by volume then liquidity.
    """
    def relevance(m: Dict) -> int:
        title = (m.get("marketTitle") or "").lower()
        return sum(1 for kw in _FINANCE_KEYWORDS if kw in title)

    scored = sorted(markets, key=lambda m: (relevance(m), m.get("volume", 0)), reverse=True)
    return scored[:top_n]
