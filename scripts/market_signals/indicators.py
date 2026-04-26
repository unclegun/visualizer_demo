"""
indicators.py – Technical indicator calculations for the market signals generator.

All functions operate on plain Python lists of floats (closing prices or volumes).
No pandas dependency at this layer.
"""

import math
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Moving Averages
# ---------------------------------------------------------------------------

def sma(prices: List[float], period: int) -> Optional[float]:
    """Simple Moving Average over the last *period* values."""
    if len(prices) < period:
        return None
    window = prices[-period:]
    return round(sum(window) / period, 6)


def ema(prices: List[float], period: int) -> Optional[float]:
    """Exponential Moving Average using the standard multiplier."""
    if len(prices) < period:
        return None
    multiplier = 2.0 / (period + 1)
    result = sum(prices[:period]) / period
    for price in prices[period:]:
        result = (price - result) * multiplier + result
    return round(result, 6)


# ---------------------------------------------------------------------------
# RSI (Wilder's method)
# ---------------------------------------------------------------------------

def rsi(prices: List[float], period: int = 14) -> Optional[float]:
    """Relative Strength Index (Wilder smoothing).

    Requires at least *period + 1* data points.
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

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0.0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100.0 - 100.0 / (1.0 + rs), 2)


# ---------------------------------------------------------------------------
# Volatility
# ---------------------------------------------------------------------------

def volatility(prices: List[float], period: int = 20) -> Optional[float]:
    """Annualised daily volatility as a fraction (e.g. 0.08 = 8%).

    Standard deviation of daily log-returns, annualised by sqrt(252).
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
    return round(daily_vol * math.sqrt(252), 6)


# ---------------------------------------------------------------------------
# Volume helpers
# ---------------------------------------------------------------------------

def average_volume(volumes: List[float], period: int = 20) -> Optional[float]:
    """Simple average of the last *period* volume values."""
    if len(volumes) < period:
        return None
    window = volumes[-period:]
    return round(sum(window) / period, 2)


# ---------------------------------------------------------------------------
# Trend / momentum
# ---------------------------------------------------------------------------

def trend_slope(prices: List[float], period: int) -> Optional[float]:
    """Linear regression slope over the last *period* prices, normalised by mean.

    Positive → uptrend; negative → downtrend.
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
    """Return True if *price* is above the SMA(period)."""
    ma = sma(prices, period)
    if ma is None:
        return None
    return price > ma


def pct_change_n(prices: List[float], n: int) -> Optional[float]:
    """Return percent change of last price vs n periods ago."""
    if len(prices) < n + 1:
        return None
    prev = prices[-(n + 1)]
    curr = prices[-1]
    if prev == 0:
        return None
    return round((curr - prev) / abs(prev) * 100, 4)


# ---------------------------------------------------------------------------
# Gap
# ---------------------------------------------------------------------------

def gap_pct(current_open: Optional[float], prev_close: Optional[float]) -> Optional[float]:
    """Percentage gap between today's open and yesterday's close."""
    if not current_open or not prev_close:
        return None
    return round((current_open - prev_close) / abs(prev_close) * 100, 4)
