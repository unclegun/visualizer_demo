"""
indicators.py – Technical indicator calculations for the penny-stock watchlist.

All functions operate on plain Python lists of floats (closing prices or volumes)
so there is no pandas dependency at this layer.  If pandas is available, callers
may pass a list(series) conversion.
"""

import math
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Moving Averages
# ---------------------------------------------------------------------------

def sma(prices: List[float], period: int) -> Optional[float]:
    """Simple Moving Average over the last *period* values.

    Returns None when there is insufficient data.
    """
    if len(prices) < period:
        return None
    window = prices[-period:]
    return round(sum(window) / period, 6)


def ema(prices: List[float], period: int) -> Optional[float]:
    """Exponential Moving Average over *prices* using the standard multiplier.

    Returns None when there is insufficient data.
    """
    if len(prices) < period:
        return None
    multiplier = 2.0 / (period + 1)
    result = sum(prices[:period]) / period  # seed with SMA
    for price in prices[period:]:
        result = (price - result) * multiplier + result
    return round(result, 6)


# ---------------------------------------------------------------------------
# RSI (Wilder's method, 14-period by default)
# ---------------------------------------------------------------------------

def rsi(prices: List[float], period: int = 14) -> Optional[float]:
    """Relative Strength Index (Wilder smoothing).

    Requires at least *period + 1* data points.  Returns None otherwise.
    Value is in the range [0, 100].
    """
    if len(prices) < period + 1:
        return None

    gains: List[float] = []
    losses: List[float] = []
    for i in range(1, len(prices)):
        delta = prices[i] - prices[i - 1]
        gains.append(max(delta, 0.0))
        losses.append(max(-delta, 0.0))

    # Initial averages (simple average of first *period* values)
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    # Wilder smoothing for remaining values
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0.0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100.0 - 100.0 / (1.0 + rs), 2)


# ---------------------------------------------------------------------------
# Volatility (normalised standard deviation of returns)
# ---------------------------------------------------------------------------

def volatility(prices: List[float], period: int = 20) -> Optional[float]:
    """Annualised daily volatility as a fraction (e.g. 0.08 = 8%).

    Calculated as the standard deviation of daily log-returns over the last
    *period* days, annualised by multiplying by sqrt(252).

    Returns None when there is insufficient data.
    """
    if len(prices) < period + 1:
        return None

    window = prices[-(period + 1):]
    returns: List[float] = []
    for i in range(1, len(window)):
        if window[i - 1] > 0 and window[i] > 0:
            returns.append(math.log(window[i] / window[i - 1]))

    if len(returns) < 2:
        return None

    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
    daily_vol = math.sqrt(variance)
    annualised = daily_vol * math.sqrt(252)
    return round(annualised, 6)


# ---------------------------------------------------------------------------
# Average Volume
# ---------------------------------------------------------------------------

def average_volume(volumes: List[float], period: int = 20) -> Optional[float]:
    """Simple average of the last *period* volume values."""
    if len(volumes) < period:
        return None
    window = volumes[-period:]
    return round(sum(window) / period, 2)


# ---------------------------------------------------------------------------
# Trend helpers
# ---------------------------------------------------------------------------

def trend_slope(prices: List[float], period: int) -> Optional[float]:
    """Linear regression slope over the last *period* prices, normalised by the
    mean price so the result is a dimensionless rate-of-change.

    Positive → uptrend; negative → downtrend.
    Returns None when there is insufficient data.
    """
    if len(prices) < period:
        return None

    window = prices[-period:]
    n = len(window)
    x_mean = (n - 1) / 2.0
    y_mean = sum(window) / n

    numerator = sum((i - x_mean) * (window[i] - y_mean) for i in range(n))
    denominator = sum((i - x_mean) ** 2 for i in range(n))

    if denominator == 0 or y_mean == 0:
        return None

    return round(numerator / denominator / y_mean, 8)


def is_above_sma(price: float, prices: List[float], period: int) -> Optional[bool]:
    """Return True if *price* is above the SMA(period), False if below, None if insufficient data."""
    ma = sma(prices, period)
    if ma is None:
        return None
    return price > ma


# ---------------------------------------------------------------------------
# Gap percentage
# ---------------------------------------------------------------------------

def gap_pct(current_open: Optional[float], prev_close: Optional[float]) -> Optional[float]:
    """Percentage gap between today's open and yesterday's close.

    Returns None when either value is missing or zero.
    """
    if not current_open or not prev_close:
        return None
    return round((current_open - prev_close) / abs(prev_close) * 100, 4)
