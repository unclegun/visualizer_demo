"""
scoring.py – Deterministic scoring model for penny-stock candidates.

Scoring philosophy:
  - No ML, no paid data, no guaranteed outcomes.
  - Score represents a weighted sum of observable technical signals.
  - Higher score = more signals align; does NOT mean "buy."
  - All assumptions are documented inline.

Score components (max ~100 points total):
  Momentum score  (max 30) – short-term price trend
  Liquidity score (max 30) – volume / relative-volume quality
  Risk score      (max 30) – price range, volatility, RSI positioning
  Bonus           (max 10) – above SMA cross, positive gap, etc.
  Penalties       (up to -40) – extreme volatility, missing data, etc.
"""

import logging
from typing import Any, Dict, List, Optional

from indicators import (
    average_volume,
    ema,
    gap_pct,
    is_above_sma,
    rsi,
    sma,
    trend_slope,
    volatility,
)
from utils import clamp, pct_change, safe_div

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Thresholds (tweak here, not in the scoring logic)
# ---------------------------------------------------------------------------

PRICE_MIN = 0.50       # Below this: out of penny-stock sweet spot
PRICE_MAX = 5.00       # Above this: out of penny-stock sweet spot
RSI_OVERSOLD = 30
RSI_OVERBOUGHT = 75    # Elevated RSI can still be strong but adds risk
RVOL_HIGH = 2.0        # Relative volume above this is a positive signal
RVOL_VERY_HIGH = 5.0   # Very high RVOL is bullish but adds volatility risk
VOL_MIN_DAILY = 500_000  # Minimum daily volume for liquidity
VOL_IDEAL = 2_000_000    # Ideal daily volume floor
ANN_VOL_HIGH = 1.5     # Annualised volatility >150% is a penalty
ANN_VOL_MODERATE = 0.8 # Annualised volatility >80% mild penalty


def _momentum_score(
    pct_chg: float,
    slope_5: Optional[float],
    slope_20: Optional[float],
    above_sma5: Optional[bool],
    above_sma20: Optional[bool],
    rsi_val: Optional[float],
) -> int:
    """Score short-term momentum (0-30)."""
    score = 0

    # Day change contribution (max 8 pts)
    if pct_chg >= 10:
        score += 8
    elif pct_chg >= 5:
        score += 6
    elif pct_chg >= 2:
        score += 4
    elif pct_chg >= 0:
        score += 2
    else:
        score -= 2  # negative day

    # 5-day slope (max 8 pts)
    if slope_5 is not None:
        if slope_5 > 0.01:
            score += 8
        elif slope_5 > 0.003:
            score += 5
        elif slope_5 > 0:
            score += 2
        else:
            score -= 3

    # 20-day slope (max 6 pts)
    if slope_20 is not None:
        if slope_20 > 0.005:
            score += 6
        elif slope_20 > 0:
            score += 3
        else:
            score -= 2

    # Above SMA bonuses (max 8 pts combined, awarded below)
    if above_sma5 is True:
        score += 4
    if above_sma20 is True:
        score += 4

    # RSI contribution (max 4 pts)
    if rsi_val is not None:
        if 45 <= rsi_val <= 65:
            score += 4   # sweet spot: rising but not extended
        elif 35 <= rsi_val < 45:
            score += 2   # recovering from oversold
        elif rsi_val > RSI_OVERBOUGHT:
            score -= 3   # potentially overbought

    return clamp(score, 0, 30)


def _liquidity_score(
    volume: float,
    avg_vol: Optional[float],
    rel_vol: Optional[float],
) -> int:
    """Score volume and liquidity quality (0-30)."""
    score = 0

    # Absolute volume (max 12 pts)
    if volume >= 5_000_000:
        score += 12
    elif volume >= VOL_IDEAL:
        score += 9
    elif volume >= VOL_MIN_DAILY:
        score += 5
    elif volume >= 100_000:
        score += 2
    else:
        score -= 5  # very illiquid

    # Relative volume (max 12 pts)
    if rel_vol is not None:
        if rel_vol >= RVOL_VERY_HIGH:
            score += 12
        elif rel_vol >= RVOL_HIGH:
            score += 8
        elif rel_vol >= 1.2:
            score += 4
        elif rel_vol < 0.5:
            score -= 4

    # Average volume quality (max 6 pts)
    if avg_vol is not None:
        if avg_vol >= VOL_IDEAL:
            score += 6
        elif avg_vol >= VOL_MIN_DAILY:
            score += 3

    return clamp(score, 0, 30)


def _risk_score(
    price: float,
    ann_vol: Optional[float],
    rsi_val: Optional[float],
) -> int:
    """Score risk/reward positioning (0-30).  Higher = better risk profile."""
    score = 15  # Start at neutral

    # Price in sweet spot ($0.50 – $5.00) adds points
    if PRICE_MIN <= price <= PRICE_MAX:
        score += 5
    elif price < PRICE_MIN:
        score -= 5   # sub-penny, very speculative
    else:
        score -= 3   # above $5 is no longer "penny"

    # Volatility (lower is better for risk-adjusted return)
    if ann_vol is not None:
        if ann_vol < 0.4:
            score += 5    # relatively calm
        elif ann_vol < 0.8:
            score += 2
        elif ann_vol > ANN_VOL_HIGH:
            score -= 8    # extreme volatility: large penalty
        elif ann_vol > ANN_VOL_MODERATE:
            score -= 4

    # RSI not overextended
    if rsi_val is not None:
        if rsi_val < RSI_OVERSOLD:
            score += 3    # oversold can mean reversal opportunity
        elif rsi_val > RSI_OVERBOUGHT:
            score -= 4

    return clamp(score, 0, 30)


def _bonus_and_penalties(
    gap: Optional[float],
    missing_fields: int,
    above_sma5: Optional[bool],
    above_sma20: Optional[bool],
) -> int:
    """Compute bonus/penalty adjustments (-40 to +10)."""
    adj = 0

    # Positive gap (opened above prior close): momentum bonus
    if gap is not None and gap > 2.0:
        adj += 5
    elif gap is not None and gap < -3.0:
        adj -= 5

    # Missing data penalty (each missing key field costs 2 pts, max -20)
    adj -= min(missing_fields * 2, 20)

    return clamp(adj, -40, 10)


# ---------------------------------------------------------------------------
# Entry zone / stop loss / target helpers
# Financial assumption: entry zone is last 2% of close, stop is -5% ATR proxy,
# target is +8% (simple risk/reward 1:1.6 approximate).
# ---------------------------------------------------------------------------

def _entry_zone(price: float) -> str:
    lo = round(price * 0.99, 2)
    hi = round(price * 1.01, 2)
    return f"{lo:.2f} – {hi:.2f}"


def _stop_loss(price: float, ann_vol: Optional[float]) -> float:
    """Stop-loss set 1 ATR-proxy below entry.  Using 5% as default if vol unknown."""
    daily_risk = (ann_vol / (252 ** 0.5)) if ann_vol else 0.05
    daily_risk = max(daily_risk, 0.03)  # floor at 3%
    return round(price * (1 - daily_risk * 1.5), 2)


def _target(price: float, ann_vol: Optional[float]) -> float:
    """Target set at 2× the stop distance above entry (risk/reward ~1:2)."""
    daily_risk = (ann_vol / (252 ** 0.5)) if ann_vol else 0.05
    daily_risk = max(daily_risk, 0.03)
    return round(price * (1 + daily_risk * 3), 2)


def _risk_level(ann_vol: Optional[float], price: float) -> str:
    """Categorical risk label."""
    if price < 0.5:
        return "Very High"
    if ann_vol is None:
        return "Unknown"
    if ann_vol > 1.5:
        return "Very High"
    if ann_vol > 0.8:
        return "High"
    if ann_vol > 0.4:
        return "Moderate"
    return "Lower"


# ---------------------------------------------------------------------------
# Reason / warning builders
# ---------------------------------------------------------------------------

def _build_reasons(
    pct_chg: float,
    rel_vol: Optional[float],
    slope_5: Optional[float],
    above_sma5: Optional[bool],
    above_sma20: Optional[bool],
    rsi_val: Optional[float],
    gap: Optional[float],
) -> List[str]:
    reasons: List[str] = []
    if rel_vol is not None and rel_vol >= RVOL_HIGH:
        reasons.append(f"Relative volume is elevated ({rel_vol:.2f}×)")
    if pct_chg >= 3:
        reasons.append(f"Up {pct_chg:.1f}% on the day")
    if slope_5 is not None and slope_5 > 0.003:
        reasons.append("Short-term (5-day) momentum is positive")
    if above_sma5 is True:
        reasons.append("Price is above the 5-day moving average")
    if above_sma20 is True:
        reasons.append("Price is above the 20-day moving average")
    if rsi_val is not None and 40 <= rsi_val <= 65:
        reasons.append(f"RSI ({rsi_val:.1f}) is in a healthy range")
    if gap is not None and gap > 2.0:
        reasons.append(f"Positive opening gap ({gap:.1f}%)")
    if not reasons:
        reasons.append("No strong bullish signals detected – low conviction")
    return reasons


def _build_warnings(
    price: float,
    ann_vol: Optional[float],
    rsi_val: Optional[float],
    rel_vol: Optional[float],
    missing_fields: int,
) -> List[str]:
    warnings: List[str] = [
        "Penny stocks are highly volatile and speculative",
        "Recommendation uses free, possibly delayed data",
    ]
    if ann_vol is not None and ann_vol > ANN_VOL_HIGH:
        warnings.append(f"Extreme annualised volatility ({ann_vol*100:.0f}%)")
    if rsi_val is not None and rsi_val > RSI_OVERBOUGHT:
        warnings.append(f"RSI ({rsi_val:.1f}) may indicate overbought conditions")
    if rel_vol is not None and rel_vol > RVOL_VERY_HIGH:
        warnings.append("Very high relative volume may indicate a pump-and-dump")
    if price < 0.50:
        warnings.append("Price below $0.50 – very high fraud/delist risk")
    if missing_fields > 0:
        warnings.append(f"{missing_fields} data field(s) could not be calculated")
    return warnings


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def score_ticker(ticker: str, history: List[Dict]) -> Optional[Dict[str, Any]]:
    """Compute a full scored record for *ticker* given its OHLCV *history*.

    *history* is a list of dicts (oldest-first) with keys:
      date, open, high, low, close, volume

    Returns a scored dict or None if there is not enough data to score.
    """
    if not history or len(history) < 5:
        logger.debug("%s: insufficient history (%d rows)", ticker, len(history) if history else 0)
        return None

    closes = [row["close"] for row in history]
    volumes = [row["volume"] for row in history]

    latest = history[-1]
    prev = history[-2]

    price = latest["close"]
    if price <= 0:
        logger.debug("%s: zero/negative price, skipping", ticker)
        return None

    prev_close = prev["close"]
    pct_chg = pct_change(price, prev_close)

    # Volume metrics
    today_vol = latest["volume"]
    avg_vol = average_volume(volumes, 20)
    rel_vol = safe_div(today_vol, avg_vol) if avg_vol else None

    # Technical indicators
    rsi_val = rsi(closes, 14)
    ann_vol = volatility(closes, 20)
    slope_5 = trend_slope(closes, 5)
    slope_20 = trend_slope(closes, 20)
    above_sma5 = is_above_sma(price, closes, 5)
    above_sma20 = is_above_sma(price, closes, 20)
    sma5_val = sma(closes, 5)
    sma20_val = sma(closes, 20)

    # Gap (open vs prior close) – free data may not include intraday open
    gap = gap_pct(latest.get("open"), prev_close)

    # Count missing fields for penalty
    missing = sum(
        1 for v in [rsi_val, ann_vol, slope_5, slope_20, avg_vol, rel_vol]
        if v is None
    )

    # Sub-scores
    mom = _momentum_score(pct_chg, slope_5, slope_20, above_sma5, above_sma20, rsi_val)
    liq = _liquidity_score(today_vol, avg_vol, rel_vol)
    risk = _risk_score(price, ann_vol, rsi_val)
    bonus = _bonus_and_penalties(gap, missing, above_sma5, above_sma20)

    total_score = clamp(mom + liq + risk + bonus, 0, 100)

    return {
        "ticker": ticker.upper(),
        "score": total_score,
        "price": round(price, 4),
        "percentChange": round(pct_chg, 2),
        "volume": int(today_vol),
        "averageVolume": int(avg_vol) if avg_vol is not None else None,
        "relativeVolume": round(rel_vol, 2) if rel_vol is not None else None,
        "rsi": round(rsi_val, 1) if rsi_val is not None else None,
        "volatility": round(ann_vol, 4) if ann_vol is not None else None,
        "sma5": round(sma5_val, 4) if sma5_val is not None else None,
        "sma20": round(sma20_val, 4) if sma20_val is not None else None,
        "gapPct": round(gap, 2) if gap is not None else None,
        "momentumScore": mom,
        "liquidityScore": liq,
        "riskScore": risk,
        "entryZone": _entry_zone(price),
        "stopLoss": _stop_loss(price, ann_vol),
        "target": _target(price, ann_vol),
        "riskLevel": _risk_level(ann_vol, price),
        "reasons": _build_reasons(pct_chg, rel_vol, slope_5, above_sma5, above_sma20, rsi_val, gap),
        "warnings": _build_warnings(price, ann_vol, rsi_val, rel_vol, missing),
        "marketDate": latest["date"],
    }
