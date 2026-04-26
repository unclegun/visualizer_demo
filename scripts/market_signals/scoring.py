"""
scoring.py – Deterministic scoring for penny stocks, prediction markets,
             and the combined market signal.

Philosophy:
  - No ML, no paid data, no guaranteed outcomes.
  - Higher score = more signals align; not a "buy" signal.
  - All logic is deterministic and documented inline.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

from indicators import (
    average_volume,
    gap_pct,
    is_above_sma,
    pct_change_n,
    rsi,
    sma,
    trend_slope,
    volatility,
)
from utils import clamp, pct_change, safe_div

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Penny stock thresholds
# ---------------------------------------------------------------------------

PS_PRICE_MIN = 0.50
PS_PRICE_MAX = 5.00
PS_RSI_OVERSOLD = 30
PS_RSI_OVERBOUGHT = 75
PS_RVOL_HIGH = 2.0
PS_RVOL_VERY_HIGH = 5.0
PS_VOL_MIN = 500_000
PS_VOL_IDEAL = 2_000_000
PS_ANN_VOL_HIGH = 1.5
PS_ANN_VOL_MOD = 0.8


# ============================================================
# Penny stock scoring
# ============================================================

def _ps_momentum(
    pct_chg: float,
    slope_5: Optional[float],
    slope_20: Optional[float],
    above_sma5: Optional[bool],
    above_sma20: Optional[bool],
    rsi_val: Optional[float],
    chg_5d: Optional[float],
    chg_20d: Optional[float],
) -> int:
    score = 0

    # 1-day change (max 8)
    if pct_chg >= 10:
        score += 8
    elif pct_chg >= 5:
        score += 6
    elif pct_chg >= 2:
        score += 4
    elif pct_chg >= 0:
        score += 2
    else:
        score -= 2

    # 5-day slope (max 8)
    if slope_5 is not None:
        if slope_5 > 0.01:
            score += 8
        elif slope_5 > 0.003:
            score += 5
        elif slope_5 > 0:
            score += 2
        else:
            score -= 3

    # 20-day slope (max 6)
    if slope_20 is not None:
        if slope_20 > 0.005:
            score += 6
        elif slope_20 > 0:
            score += 3
        else:
            score -= 2

    # Above SMA bonuses (max 8)
    if above_sma5 is True:
        score += 4
    if above_sma20 is True:
        score += 4

    # RSI contribution (max 4)
    if rsi_val is not None:
        if 45 <= rsi_val <= 65:
            score += 4
        elif 35 <= rsi_val < 45:
            score += 2
        elif rsi_val > PS_RSI_OVERBOUGHT:
            score -= 3

    # 5-day and 20-day change boosts (max 4)
    if chg_5d is not None and chg_5d > 5:
        score += 2
    if chg_20d is not None and chg_20d > 10:
        score += 2

    return clamp(score, 0, 30)


def _ps_liquidity(
    volume: float,
    avg_vol: Optional[float],
    rel_vol: Optional[float],
) -> int:
    score = 0

    if volume >= 5_000_000:
        score += 12
    elif volume >= PS_VOL_IDEAL:
        score += 9
    elif volume >= PS_VOL_MIN:
        score += 5
    elif volume >= 100_000:
        score += 2
    else:
        score -= 5

    if rel_vol is not None:
        if rel_vol >= PS_RVOL_VERY_HIGH:
            score += 12
        elif rel_vol >= PS_RVOL_HIGH:
            score += 8
        elif rel_vol >= 1.2:
            score += 4
        elif rel_vol < 0.5:
            score -= 4

    if avg_vol is not None:
        if avg_vol >= PS_VOL_IDEAL:
            score += 6
        elif avg_vol >= PS_VOL_MIN:
            score += 3

    return clamp(score, 0, 30)


def _ps_risk(price: float, ann_vol: Optional[float], rsi_val: Optional[float]) -> int:
    score = 15

    if PS_PRICE_MIN <= price <= PS_PRICE_MAX:
        score += 5
    elif price < PS_PRICE_MIN:
        score -= 5
    else:
        score -= 3

    if ann_vol is not None:
        if ann_vol < 0.4:
            score += 5
        elif ann_vol < 0.8:
            score += 2
        elif ann_vol > PS_ANN_VOL_HIGH:
            score -= 8
        elif ann_vol > PS_ANN_VOL_MOD:
            score -= 4

    if rsi_val is not None:
        if rsi_val < PS_RSI_OVERSOLD:
            score += 3
        elif rsi_val > PS_RSI_OVERBOUGHT:
            score -= 4

    return clamp(score, 0, 30)


def _ps_bonus(gap: Optional[float], missing: int) -> int:
    adj = 0
    if gap is not None:
        if gap > 2.0:
            adj += 5
        elif gap < -3.0:
            adj -= 5
    adj -= min(missing * 2, 20)
    return clamp(adj, -40, 10)


def _ps_entry_zone(price: float) -> Dict[str, float]:
    return {"low": round(price * 0.99, 4), "high": round(price * 1.01, 4)}


def _ps_stop_loss(price: float, ann_vol: Optional[float]) -> float:
    daily_risk = (ann_vol / (252 ** 0.5)) if ann_vol else 0.05
    daily_risk = max(daily_risk, 0.03)
    return round(price * (1 - daily_risk * 1.5), 4)


def _ps_target(price: float, ann_vol: Optional[float]) -> float:
    daily_risk = (ann_vol / (252 ** 0.5)) if ann_vol else 0.05
    daily_risk = max(daily_risk, 0.03)
    return round(price * (1 + daily_risk * 3), 4)


def _ps_risk_level(ann_vol: Optional[float], price: float) -> str:
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


def _ps_confidence(score: int) -> str:
    if score >= 70:
        return "Strong Candidate"
    if score >= 50:
        return "Moderate Candidate"
    if score >= 35:
        return "Weak Signal"
    return "Insufficient Signal"


def _ps_justification(
    pct_chg: float,
    rel_vol: Optional[float],
    slope_5: Optional[float],
    above_sma5: Optional[bool],
    above_sma20: Optional[bool],
    rsi_val: Optional[float],
    gap: Optional[float],
) -> List[str]:
    j: List[str] = []
    if rel_vol is not None and rel_vol >= PS_RVOL_HIGH:
        j.append(f"Relative volume is {rel_vol:.2f}× average.")
    if pct_chg >= 3:
        j.append(f"Up {pct_chg:.1f}% on the day.")
    if slope_5 is not None and slope_5 > 0.003:
        j.append("Short-term (5-day) momentum is positive.")
    if above_sma5 is True:
        j.append("Price is above SMA5.")
    if above_sma20 is True:
        j.append("Price is above SMA20.")
    if rsi_val is not None and 40 <= rsi_val <= 65:
        j.append(f"RSI ({rsi_val:.1f}) is in a healthy range.")
    if gap is not None and gap > 2.0:
        j.append(f"Positive opening gap ({gap:.1f}%).")
    if not j:
        j.append("No strong bullish signals detected.")
    return j


def _ps_warnings(
    price: float,
    ann_vol: Optional[float],
    rsi_val: Optional[float],
    rel_vol: Optional[float],
    missing: int,
) -> List[str]:
    w = ["Free data may be delayed."]
    if ann_vol is not None and ann_vol > PS_ANN_VOL_HIGH:
        w.append(f"Extreme annualised volatility ({ann_vol * 100:.0f}%).")
    if rsi_val is not None and rsi_val > PS_RSI_OVERBOUGHT:
        w.append(f"RSI ({rsi_val:.1f}) may indicate overbought conditions.")
    if rel_vol is not None and rel_vol > PS_RVOL_VERY_HIGH:
        w.append("Very high RVOL – possible pump-and-dump risk.")
    if price < 0.50:
        w.append("Price below $0.50 – very high fraud/delist risk.")
    if missing > 0:
        w.append(f"{missing} data field(s) could not be calculated.")
    return w


def _ps_suggested_action(score: int, rel_vol: Optional[float], rsi_val: Optional[float]) -> str:
    if score >= 65:
        if rel_vol and rel_vol >= PS_RVOL_HIGH:
            return "Consider only if volume confirms at open"
        return "Watch for momentum confirmation"
    if score >= 45:
        return "Monitor – wait for volume and price confirmation"
    return "Avoid – insufficient signal quality"


def score_penny_stock(ticker: str, history: List[Dict]) -> Optional[Dict[str, Any]]:
    """Compute a full scored record for *ticker* given its OHLCV *history*.

    *history* is a list of dicts (oldest-first) with keys:
      date, open, high, low, close, volume

    Returns a scored dict or None if there is not enough data to score.
    """
    if not history or len(history) < 5:
        return None

    closes = [row["close"] for row in history]
    volumes = [row["volume"] for row in history]

    latest = history[-1]
    prev = history[-2]

    price = latest["close"]
    if price <= 0:
        return None

    prev_close = prev["close"]
    pct_chg = pct_change(price, prev_close)

    today_vol = latest["volume"]
    avg_vol = average_volume(volumes, 20)
    rel_vol = safe_div(today_vol, avg_vol) if avg_vol else None

    rsi_val = rsi(closes, 14)
    ann_vol = volatility(closes, 20)
    slope_5 = trend_slope(closes, 5)
    slope_20 = trend_slope(closes, 20)
    above_sma5 = is_above_sma(price, closes, 5)
    above_sma20 = is_above_sma(price, closes, 20)
    sma5_val = sma(closes, 5)
    sma20_val = sma(closes, 20)
    gap = gap_pct(latest.get("open"), prev_close)
    chg_5d = pct_change_n(closes, 5)
    chg_20d = pct_change_n(closes, 20)

    missing = sum(
        1 for v in [rsi_val, ann_vol, slope_5, slope_20, avg_vol, rel_vol]
        if v is None
    )

    mom = _ps_momentum(pct_chg, slope_5, slope_20, above_sma5, above_sma20, rsi_val, chg_5d, chg_20d)
    liq = _ps_liquidity(today_vol, avg_vol, rel_vol)
    risk_s = _ps_risk(price, ann_vol, rsi_val)
    bonus = _ps_bonus(gap, missing)

    total = clamp(int(round(mom + liq + risk_s + bonus)), 0, 100)

    return {
        "ticker":         ticker.upper(),
        "companyName":    ticker.upper(),  # No free company-name API; ticker used as placeholder
        "score":          total,
        "confidence":     _ps_confidence(total),
        "latestPrice":    round(price, 4),
        "percentChange":  round(pct_chg, 2),
        "fiveDayChange":  round(chg_5d, 2) if chg_5d is not None else None,
        "twentyDayChange": round(chg_20d, 2) if chg_20d is not None else None,
        "volume":         int(today_vol),
        "averageVolume":  int(avg_vol) if avg_vol is not None else None,
        "relativeVolume": round(rel_vol, 2) if rel_vol is not None else None,
        "rsi":            round(rsi_val, 1) if rsi_val is not None else None,
        "sma5":           round(sma5_val, 4) if sma5_val is not None else None,
        "sma20":          round(sma20_val, 4) if sma20_val is not None else None,
        "volatility":     round(ann_vol, 4) if ann_vol is not None else None,
        "entryZone":      _ps_entry_zone(price),
        "stopLoss":       _ps_stop_loss(price, ann_vol),
        "target":         _ps_target(price, ann_vol),
        "riskLevel":      _ps_risk_level(ann_vol, price),
        "suggestedAction": _ps_suggested_action(total, rel_vol, rsi_val),
        "justification":  _ps_justification(pct_chg, rel_vol, slope_5, above_sma5, above_sma20, rsi_val, gap),
        "warnings":       _ps_warnings(price, ann_vol, rsi_val, rel_vol, missing),
        "momentumScore":  mom,
        "liquidityScore": liq,
        "riskScore":      risk_s,
        "marketDate":     latest["date"],
    }


# ============================================================
# Prediction market scoring
# ============================================================

# Thresholds
PM_PROB_MOVE_HIGH = 0.05    # ≥5% absolute move in probability
PM_PROB_MOVE_MOD = 0.02
PM_LIQ_HIGH = 50_000
PM_LIQ_MOD = 10_000
PM_VOL_HIGH = 100_000
PM_VOL_MOD = 20_000


def score_prediction_market(
    market: Dict[str, Any],
    prev_probability: Optional[float] = None,
) -> Dict[str, Any]:
    """Score a normalised prediction market record (0-100)."""
    prob = market.get("probability", 0.5)
    volume = market.get("volume", 0)
    liquidity = market.get("liquidity", 0)

    score = 0

    # 1. Probability in actionable range (not near 0 or 1)
    if 0.15 <= prob <= 0.85:
        score += 15
    elif 0.05 <= prob < 0.15 or 0.85 < prob <= 0.95:
        score += 7

    # 2. Probability movement
    prob_change = 0.0
    if prev_probability is not None:
        prob_change = prob - prev_probability
        abs_move = abs(prob_change)
        if abs_move >= PM_PROB_MOVE_HIGH:
            score += 25
        elif abs_move >= PM_PROB_MOVE_MOD:
            score += 15
        elif abs_move > 0.005:
            score += 7

    # 3. Liquidity
    if liquidity >= PM_LIQ_HIGH:
        score += 20
    elif liquidity >= PM_LIQ_MOD:
        score += 12
    elif liquidity >= 1_000:
        score += 5
    else:
        score -= 10  # illiquid market penalty

    # 4. Volume
    if volume >= PM_VOL_HIGH:
        score += 20
    elif volume >= PM_VOL_MOD:
        score += 12
    elif volume >= 1_000:
        score += 5
    else:
        score -= 5

    # 5. Direction preference: slight movement in a direction is more interesting
    if abs(prob_change) < 0.005 and prev_probability is not None:
        score -= 5  # stale/no movement penalty

    total = clamp(score, 0, 100)

    # Suggested action
    if total >= 65 and abs(prob_change) >= PM_PROB_MOVE_MOD:
        direction = "YES" if prob_change > 0 else "NO"
        action = f"Watch / Possible {direction} entry"
    elif total >= 45:
        action = "Monitor for further movement"
    else:
        action = "Avoid – low liquidity or no signal"

    justification: List[str] = []
    if liquidity >= PM_LIQ_MOD:
        justification.append("Liquidity is sufficient.")
    if volume >= PM_VOL_MOD:
        justification.append("Volume confirms active interest.")
    if abs(prob_change) >= PM_PROB_MOVE_MOD:
        direction_word = "increased" if prob_change > 0 else "decreased"
        justification.append(f"Probability {direction_word} sharply ({prob_change:+.1%}).")
    if not justification:
        justification.append("No strong signals detected.")

    return {
        **market,
        "score":               total,
        "previousProbability": round(prev_probability, 4) if prev_probability is not None else None,
        "probabilityChange":   round(prob_change, 4),
        "suggestedAction":     action,
        "justification":       justification,
    }


# ============================================================
# Combined market signal
# ============================================================

def compute_combined_signals(
    penny_stocks: List[Dict],
    prediction_markets: List[Dict],
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Compute combined market bias and signal panel from scored inputs.

    Returns (marketBias dict, combinedSignals list).
    """
    # --- Penny stock signal ---
    ps_scores = [s["score"] for s in penny_stocks if s.get("score") is not None]
    ps_avg = sum(ps_scores) / len(ps_scores) if ps_scores else 0
    ps_rvols = [s["relativeVolume"] for s in penny_stocks if s.get("relativeVolume") is not None]
    ps_avg_rvol = sum(ps_rvols) / len(ps_rvols) if ps_rvols else 1.0

    # Normalise penny stock signal to 0-100
    ps_signal = clamp(int(ps_avg), 0, 100)

    # --- Prediction market signal ---
    pm_scores = [m["score"] for m in prediction_markets if m.get("score") is not None]
    pm_avg = sum(pm_scores) / len(pm_scores) if pm_scores else 0
    pm_signal = clamp(int(pm_avg), 0, 100)

    # --- Overall market bias ---
    combined_score = int(round((ps_signal * 0.6 + pm_signal * 0.4)))
    combined_score = clamp(combined_score, 0, 100)

    if combined_score >= 65:
        bias_label = "Risk-On"
    elif combined_score >= 45:
        bias_label = "Neutral"
    else:
        bias_label = "Risk-Off"

    # Reasoning bullets
    reasoning: List[str] = []
    if ps_scores:
        reasoning.append(
            f"Penny stock avg score is {ps_avg:.1f}/100 "
            f"({'elevated' if ps_avg >= 55 else 'subdued'})."
        )
        reasoning.append(
            f"Average relative volume is {ps_avg_rvol:.2f}× "
            f"({'strong' if ps_avg_rvol >= 2 else 'moderate' if ps_avg_rvol >= 1.2 else 'weak'})."
        )
    else:
        reasoning.append("No penny stock data available.")

    if pm_scores:
        reasoning.append(
            f"Prediction market avg score is {pm_avg:.1f}/100."
        )
    else:
        reasoning.append("Prediction market data unavailable.")

    # Best move
    if combined_score >= 65:
        best_action = "Consider Entry"
        best_summary = (
            "Market signals are broadly positive; focus on high-scoring tickers "
            "with volume confirmation at open."
        )
    elif combined_score >= 50:
        best_action = "Watch"
        best_summary = (
            "Signals are mixed; monitor top-ranked candidates for intraday "
            "confirmation before acting."
        )
    elif combined_score >= 35:
        best_action = "Wait for Confirmation"
        best_summary = (
            "Signals are weak or fragmented; wait for clearer momentum "
            "before committing capital."
        )
    else:
        best_action = "Avoid"
        best_summary = (
            "Most signals are negative or absent; risk-off posture recommended today."
        )

    market_bias = {
        "label":     bias_label,
        "score":     combined_score,
        "reasoning": reasoning,
    }

    best_move = {
        "action":  best_action,
        "summary": best_summary,
    }

    # Combined signal panel
    combined_signals = [
        {
            "label":          "Small-cap momentum",
            "score":          ps_signal,
            "interpretation": (
                "Penny stock momentum is elevated but requires confirmation."
                if ps_signal >= 55
                else "Penny stock momentum is subdued or data is limited."
            ),
        },
        {
            "label":          "Prediction market confirmation",
            "score":          pm_signal,
            "interpretation": (
                "Macro/event markets are moderately to strongly supportive."
                if pm_signal >= 50
                else "Prediction market data is limited or shows low conviction."
            ),
        },
        {
            "label":          "Volume breadth",
            "score":          clamp(int(ps_avg_rvol * 25), 0, 100),
            "interpretation": (
                "Volume is notably above average across top candidates."
                if ps_avg_rvol >= 2
                else "Volume is near or below average; lower conviction."
            ),
        },
    ]

    return market_bias, best_move, combined_signals
