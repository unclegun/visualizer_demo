"""
utils.py – Shared helper utilities for the market signals generator.
"""

import json
import logging
import os
import sys
from datetime import date, datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def setup_logging(level: int = logging.INFO) -> None:
    """Configure root logger with a human-readable format."""
    logging.basicConfig(
        stream=sys.stdout,
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


# ---------------------------------------------------------------------------
# JSON helpers
# ---------------------------------------------------------------------------

def load_json(path: str) -> Any:
    """Load and return JSON from *path*. Raises FileNotFoundError if missing."""
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save_json(path: str, data: Any, indent: int = 2) -> None:
    """Serialise *data* to JSON at *path*, creating parent directories as needed."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=indent, default=_json_default)
    logger.debug("Saved JSON → %s", path)


def _json_default(obj: Any) -> Any:
    """JSON serialisation fallback for date/datetime objects."""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serialisable")


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------

def utc_now_iso() -> str:
    """Return current UTC timestamp as an ISO-8601 string (with Z suffix)."""
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def today_str() -> str:
    """Return today's date as YYYY-MM-DD."""
    return date.today().isoformat()


def last_business_date() -> str:
    """Return the most recent weekday date string (YYYY-MM-DD)."""
    from datetime import timedelta
    today = date.today()
    offset = max(1, today.weekday() - 4) if today.weekday() >= 5 else 0
    return (today - timedelta(days=offset)).isoformat()


# ---------------------------------------------------------------------------
# Numeric helpers
# ---------------------------------------------------------------------------

def safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Divide, returning *default* when denominator is zero or None."""
    if not denominator:
        return default
    return numerator / denominator


def clamp(value: float, lo: float, hi: float) -> float:
    """Clamp *value* to the range [lo, hi]."""
    return max(lo, min(hi, value))


def pct_change(current: float, previous: float) -> float:
    """Return percent change from *previous* to *current* (as a float, e.g. 5.3 means 5.3%)."""
    if not previous:
        return 0.0
    return round((current - previous) / abs(previous) * 100, 4)
