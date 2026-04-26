"""
penny_stock_sources.py – Free public data fetchers for penny stock price history.

Priority order for price history:
  1. Stooq CSV endpoints (free, no key required, ~15-min delay on US tickers)
  2. Yahoo Finance unofficial JSON (fallback, may be rate-limited)

Returns plain Python structures (no pandas required).
"""

import csv
import io
import json
import logging
import time
import urllib.error
import urllib.request
from datetime import date
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

STOOQ_BASE = "https://stooq.com/q/d/l/?s={ticker}.US&i=d"
YAHOO_CHART = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    "?interval=1d&range=60d"
)

_REQUEST_DELAY = 1.5   # seconds between outbound requests
_TIMEOUT = 15          # socket timeout in seconds
_USER_AGENT = (
    "market-signal-dashboard/1.0 "
    "(github.com/educational-project; not-for-trading)"
)


# ---------------------------------------------------------------------------
# Low-level HTTP helper
# ---------------------------------------------------------------------------

def _fetch(url: str, headers: Optional[Dict[str, str]] = None) -> Optional[bytes]:
    """Perform an HTTP GET and return raw bytes, or None on any failure."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": _USER_AGENT, **(headers or {})},
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return resp.read()
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
        logger.warning("HTTP fetch failed for %s: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# Stooq CSV
# ---------------------------------------------------------------------------

def fetch_price_history_stooq(ticker: str) -> Optional[List[Dict]]:
    """Fetch up to ~3 months of daily OHLCV data from Stooq.

    Returns a list of dicts sorted oldest-first:
      [{"date": "2024-01-02", "open": 1.5, "high": 1.6, "low": 1.4,
        "close": 1.55, "volume": 1234567}, ...]
    Returns None on failure.
    """
    url = STOOQ_BASE.format(ticker=ticker.upper())
    raw = _fetch(url)
    if not raw:
        return None

    text = raw.decode("utf-8", errors="replace")
    if "no data" in text.lower() or len(text.strip().splitlines()) < 3:
        logger.debug("Stooq returned no data for %s", ticker)
        return None

    rows: List[Dict] = []
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        try:
            rows.append({
                "date":   row.get("Date", ""),
                "open":   float(row.get("Open", 0) or 0),
                "high":   float(row.get("High", 0) or 0),
                "low":    float(row.get("Low", 0) or 0),
                "close":  float(row.get("Close", 0) or 0),
                "volume": float(row.get("Volume", 0) or 0),
            })
        except (ValueError, KeyError):
            continue

    if not rows:
        return None

    rows.sort(key=lambda r: r["date"])
    return rows


# ---------------------------------------------------------------------------
# Yahoo Finance (unofficial fallback)
# ---------------------------------------------------------------------------

def fetch_price_history_yahoo(ticker: str) -> Optional[List[Dict]]:
    """Fetch ~60 days of daily OHLCV from Yahoo Finance's unofficial chart API.

    NOTE: Yahoo may throttle or block requests without notice.
    """
    url = YAHOO_CHART.format(ticker=ticker.upper())
    raw = _fetch(url, headers={"Accept": "application/json"})
    if not raw:
        return None

    try:
        data = json.loads(raw)
        result = data["chart"]["result"][0]
        timestamps = result["timestamp"]
        ohlcv = result["indicators"]["quote"][0]
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        logger.debug("Yahoo parse error for %s: %s", ticker, exc)
        return None

    rows: List[Dict] = []
    n = len(timestamps)
    for i, ts in enumerate(timestamps):
        try:
            dt = date.fromtimestamp(ts).isoformat()
            close = ohlcv["close"][i]
            if close is None:
                continue
            rows.append({
                "date":   dt,
                "open":   (ohlcv.get("open") or [None] * n)[i] or close,
                "high":   (ohlcv.get("high") or [None] * n)[i] or close,
                "low":    (ohlcv.get("low") or [None] * n)[i] or close,
                "close":  close,
                "volume": (ohlcv.get("volume") or [0] * n)[i] or 0,
            })
        except (IndexError, TypeError):
            continue

    rows.sort(key=lambda r: r["date"])
    return rows or None


# ---------------------------------------------------------------------------
# Combined fetch with fallback
# ---------------------------------------------------------------------------

def fetch_price_history(ticker: str, delay: float = _REQUEST_DELAY) -> Optional[List[Dict]]:
    """Fetch price history: Stooq first, Yahoo as fallback."""
    time.sleep(delay)
    data = fetch_price_history_stooq(ticker)
    if data:
        return data

    logger.info("Stooq failed for %s; trying Yahoo fallback", ticker)
    time.sleep(delay)
    return fetch_price_history_yahoo(ticker)
