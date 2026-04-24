"""
data_sources.py – Free public data fetchers for the penny-stock watchlist.

Priority order for price history:
  1. Stooq CSV endpoints (free, no key required, ~15-min delay)
  2. Yahoo Finance unofficial JSON (fallback, may be rate-limited)

Ticker universe sources (in priority order):
  1. Local data/tickers.json
  2. Nasdaq Trader FTP symbol file (http fallback)
  3. Hard-coded minimal fallback list

All functions return plain Python structures (dicts/lists) so no pandas is
required at this layer.  If pandas is available it is used internally for
CSV parsing, but the public API never exposes DataFrames.
"""

import csv
import io
import json
import logging
import os
import time
import urllib.error
import urllib.request
from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

STOOQ_BASE = "https://stooq.com/q/d/l/?s={ticker}.US&i=d"
YAHOO_CHART = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    "?interval=1d&range=60d"
)
NASDAQ_TRADER_URL = (
    "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt"
)

_REQUEST_DELAY = 1.5  # seconds between outbound requests (be polite)
_TIMEOUT = 15         # socket timeout in seconds


# ---------------------------------------------------------------------------
# Low-level HTTP helper
# ---------------------------------------------------------------------------

def _fetch(url: str, headers: Optional[Dict[str, str]] = None) -> Optional[bytes]:
    """Perform an HTTP GET and return raw bytes, or None on any failure."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "penny-stock-watchlist/1.0 "
                "(github.com/educational-project; not-for-trading)"
            ),
            **(headers or {}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return resp.read()
    except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
        logger.warning("HTTP fetch failed for %s: %s", url, exc)
        return None


# ---------------------------------------------------------------------------
# Price history – Stooq
# ---------------------------------------------------------------------------

def _stooq_url(ticker: str) -> str:
    return STOOQ_BASE.format(ticker=ticker.upper())


def fetch_price_history_stooq(ticker: str) -> Optional[List[Dict]]:
    """Fetch up to ~3 months of daily OHLCV data from Stooq.

    Returns a list of dicts sorted oldest-first:
      [{"date": "2024-01-02", "open": 1.5, "high": 1.6, "low": 1.4,
        "close": 1.55, "volume": 1234567}, ...]
    Returns None on failure.
    """
    url = _stooq_url(ticker)
    raw = _fetch(url)
    if not raw:
        return None

    text = raw.decode("utf-8", errors="replace")
    # Stooq returns "No data" when the ticker is unknown
    if "no data" in text.lower() or len(text.strip().splitlines()) < 3:
        logger.debug("Stooq returned no data for %s", ticker)
        return None

    rows: List[Dict] = []
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        try:
            rows.append(
                {
                    "date": row.get("Date", ""),
                    "open": float(row.get("Open", 0) or 0),
                    "high": float(row.get("High", 0) or 0),
                    "low": float(row.get("Low", 0) or 0),
                    "close": float(row.get("Close", 0) or 0),
                    "volume": float(row.get("Volume", 0) or 0),
                }
            )
        except (ValueError, KeyError):
            continue

    if not rows:
        return None

    # Sort ascending by date (Stooq order may vary)
    rows.sort(key=lambda r: r["date"])
    return rows


# ---------------------------------------------------------------------------
# Price history – Yahoo Finance (unofficial, fallback)
# ---------------------------------------------------------------------------

def fetch_price_history_yahoo(ticker: str) -> Optional[List[Dict]]:
    """Fetch ~60 days of daily OHLCV from Yahoo Finance's unofficial chart API.

    Returns the same schema as fetch_price_history_stooq.
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
    for i, ts in enumerate(timestamps):
        try:
            dt = date.fromtimestamp(ts).isoformat()
            close = ohlcv["close"][i]
            if close is None:
                continue
            rows.append(
                {
                    "date": dt,
                    "open": ohlcv.get("open", [None] * len(timestamps))[i] or close,
                    "high": ohlcv.get("high", [None] * len(timestamps))[i] or close,
                    "low": ohlcv.get("low", [None] * len(timestamps))[i] or close,
                    "close": close,
                    "volume": ohlcv.get("volume", [0] * len(timestamps))[i] or 0,
                }
            )
        except (IndexError, TypeError):
            continue

    rows.sort(key=lambda r: r["date"])
    return rows or None


# ---------------------------------------------------------------------------
# Combined: try Stooq first, fall back to Yahoo
# ---------------------------------------------------------------------------

def fetch_price_history(ticker: str, delay: float = _REQUEST_DELAY) -> Optional[List[Dict]]:
    """Fetch price history trying Stooq then Yahoo as fallback.

    Inserts a polite delay between requests.
    """
    time.sleep(delay)
    data = fetch_price_history_stooq(ticker)
    if data:
        return data

    logger.info("Stooq failed for %s; trying Yahoo fallback", ticker)
    time.sleep(delay)
    return fetch_price_history_yahoo(ticker)


# ---------------------------------------------------------------------------
# Ticker universe
# ---------------------------------------------------------------------------

def load_ticker_universe(tickers_json_path: str) -> List[str]:
    """Load the candidate ticker list from the local JSON file.

    Falls back to a small hard-coded list if the file is absent or malformed.
    """
    try:
        with open(tickers_json_path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        tickers = data.get("tickers", [])
        if tickers:
            logger.info("Loaded %d tickers from %s", len(tickers), tickers_json_path)
            return [str(t).upper().strip() for t in tickers if t]
    except (FileNotFoundError, json.JSONDecodeError, KeyError) as exc:
        logger.warning("Could not load ticker universe from file: %s", exc)

    logger.warning("Using hard-coded fallback ticker list.")
    return _FALLBACK_TICKERS


_FALLBACK_TICKERS: List[str] = [
    "SOUN", "MARA", "RIOT", "CLSK", "HUT",
    "FFIE", "MULN", "NKLA", "GOEV", "WKHS",
    "IDEX", "SHIP", "CNEY", "GOVX", "IMPP",
    "VNET", "BTBT", "ARBK", "CIFR", "BNGO",
]
