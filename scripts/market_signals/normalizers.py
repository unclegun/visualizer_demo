"""
normalizers.py – Data normalisation helpers for the market signals generator.

Converts raw API responses from different sources into a unified internal schema.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# OHLCV normalisation
# ---------------------------------------------------------------------------

def normalize_ohlcv_row(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Normalize a raw OHLCV row into the standard internal format.

    Expected keys (case-insensitive): date, open, high, low, close, volume.
    Returns None if close is missing or zero.
    """
    try:
        close = float(raw.get("close") or raw.get("Close") or 0)
        if close <= 0:
            return None
        return {
            "date":   str(raw.get("date") or raw.get("Date") or ""),
            "open":   float(raw.get("open") or raw.get("Open") or close),
            "high":   float(raw.get("high") or raw.get("High") or close),
            "low":    float(raw.get("low") or raw.get("Low") or close),
            "close":  close,
            "volume": float(raw.get("volume") or raw.get("Volume") or 0),
        }
    except (TypeError, ValueError) as exc:
        logger.debug("normalize_ohlcv_row failed: %s – %s", raw, exc)
        return None


def normalize_ohlcv_list(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Normalize and sort a list of raw OHLCV rows oldest-first."""
    normalized = [normalize_ohlcv_row(r) for r in rows]
    valid = [r for r in normalized if r is not None]
    valid.sort(key=lambda r: r["date"])
    return valid


# ---------------------------------------------------------------------------
# Prediction market normalisation
# ---------------------------------------------------------------------------

def normalize_kalshi_market(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Normalize a raw Kalshi market object into internal format.

    Kalshi public API fields we care about (best-effort mapping):
      ticker, title, yes_bid, yes_ask, no_bid, no_ask,
      volume, open_interest, close_time, status
    """
    try:
        ticker = raw.get("ticker") or raw.get("market_ticker") or ""
        title = raw.get("title") or raw.get("question") or ticker
        status = (raw.get("status") or "").lower()
        if status not in ("open", "active", ""):
            return None  # Skip resolved/closed markets

        yes_bid = _safe_float(raw.get("yes_bid") or raw.get("last_price"))
        yes_ask = _safe_float(raw.get("yes_ask"))

        # Probability from midpoint of bid/ask or last price
        if yes_bid is not None and yes_ask is not None:
            probability = (yes_bid + yes_ask) / 2 / 100.0
        elif yes_bid is not None:
            probability = yes_bid / 100.0
        else:
            return None

        volume = _safe_float(raw.get("volume") or raw.get("volume_24h") or 0) or 0.0
        liquidity = _safe_float(raw.get("open_interest") or raw.get("liquidity") or 0) or 0.0

        return {
            "platform":    "Kalshi",
            "marketId":    str(ticker),
            "marketTitle": str(title),
            "probability": round(probability, 4),
            "volume":      int(volume),
            "liquidity":   int(liquidity),
            "side":        "YES",
            "_raw":        raw,
        }
    except (TypeError, ValueError, KeyError) as exc:
        logger.debug("normalize_kalshi_market failed: %s", exc)
        return None


def normalize_polymarket_market(raw: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Normalize a raw Polymarket market object into internal format.

    Polymarket CLOB API fields:
      condition_id, question, outcomes, outcomePrices,
      volume, liquidity, active, closed
    """
    try:
        active = raw.get("active", True)
        closed = raw.get("closed", False)
        if not active or closed:
            return None

        question = raw.get("question") or raw.get("title") or raw.get("condition_id") or ""
        outcomes = raw.get("outcomes", [])
        prices_raw = raw.get("outcomePrices", [])

        # Parse prices – may be JSON-encoded string list
        if isinstance(prices_raw, str):
            import json as _json
            try:
                prices_raw = _json.loads(prices_raw)
            except Exception:
                prices_raw = []

        if not outcomes or not prices_raw:
            return None

        # Find YES outcome
        yes_idx = None
        for i, o in enumerate(outcomes):
            if str(o).upper() in ("YES", "TRUE", "1"):
                yes_idx = i
                break
        if yes_idx is None:
            yes_idx = 0

        try:
            probability = float(prices_raw[yes_idx])
        except (IndexError, TypeError, ValueError):
            return None

        volume = _safe_float(raw.get("volume") or raw.get("volume24hr") or 0) or 0.0
        liquidity = _safe_float(raw.get("liquidity") or 0) or 0.0

        return {
            "platform":    "Polymarket",
            "marketId":    str(raw.get("condition_id") or raw.get("id") or ""),
            "marketTitle": str(question),
            "probability": round(probability, 4),
            "volume":      int(volume),
            "liquidity":   int(liquidity),
            "side":        outcomes[yes_idx] if yes_idx < len(outcomes) else "YES",
            "_raw":        raw,
        }
    except (TypeError, ValueError, KeyError) as exc:
        logger.debug("normalize_polymarket_market failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _safe_float(val: Any) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None
