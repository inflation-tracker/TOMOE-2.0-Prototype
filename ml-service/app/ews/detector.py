"""Early Warning System — anomaly detection for commodity prices."""
import numpy as np
import pandas as pd
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def compute_zscore_threshold(series: pd.Series, window: int = 30) -> tuple[float, float]:
    """Compute rolling mean ± 2σ threshold."""
    mu = series.rolling(window).mean().iloc[-1]
    sigma = series.rolling(window).std().iloc[-1]
    return float(mu - 2 * sigma), float(mu + 2 * sigma)


def detect_2sigma_breach(
    series: pd.Series,
    current_value: float,
    window: int = 30,
    n_sigma: float = 2.0,
) -> Optional[dict]:
    """
    Detect if current_value exceeds μ ± n*σ of historical series.
    Returns alert dict if breach detected, None otherwise.
    """
    if len(series) < window:
        return None

    mu = series.rolling(window).mean().iloc[-1]
    sigma = series.rolling(window).std().iloc[-1]
    upper = mu + n_sigma * sigma
    lower = mu - n_sigma * sigma

    if current_value > upper:
        return {
            "alert_type": "2sigma",
            "direction": "above",
            "actual_value": current_value,
            "threshold": float(upper),
            "mu": float(mu),
            "sigma": float(sigma),
            "severity": "high" if current_value > mu + 3 * sigma else "medium",
        }
    elif current_value < lower:
        return {
            "alert_type": "2sigma",
            "direction": "below",
            "actual_value": current_value,
            "threshold": float(lower),
            "mu": float(mu),
            "sigma": float(sigma),
            "severity": "medium",
        }
    return None


def detect_robust_breach(
    series: pd.Series,
    current_value: float,
    window: int = 30,
    n_sigma: float = 2.0,
    use_log: bool = True,
) -> Optional[dict]:
    """Robust alternative to the 2σ rule.

    Commodity prices are right-skewed and spiky, so the mean/std used by
    `detect_2sigma_breach` is easily dragged around by a single outlier and
    fires false positives. This uses the **median** and **MAD** (median
    absolute deviation, scaled by 1.4826 to approximate σ for normal data),
    which are robust to outliers, and optionally works in log-space so the
    band is multiplicative (appropriate for prices).
    """
    if len(series) < window:
        return None

    win = series.iloc[-window:]
    in_log = use_log and bool((win > 0).all()) and current_value > 0
    data = np.log(win.values) if in_log else win.values
    cv = np.log(current_value) if in_log else current_value

    med = float(np.median(data))
    mad = float(np.median(np.abs(data - med)) * 1.4826)
    if mad == 0:
        return None

    upper, lower = med + n_sigma * mad, med - n_sigma * mad
    # Convert thresholds back to price space for the response.
    to_price = (lambda x: float(np.exp(x))) if in_log else float

    if cv > upper:
        return {
            "alert_type": "robust_mad",
            "direction": "above",
            "actual_value": current_value,
            "threshold": to_price(upper),
            "median": to_price(med),
            "mad": mad,
            "log_space": in_log,
            "severity": "high" if cv > med + 3 * mad else "medium",
        }
    if cv < lower:
        return {
            "alert_type": "robust_mad",
            "direction": "below",
            "actual_value": current_value,
            "threshold": to_price(lower),
            "median": to_price(med),
            "mad": mad,
            "log_space": in_log,
            "severity": "medium",
        }
    return None


def detect_forecast_breach(
    actual: float,
    upper_bound: float,
    lower_bound: float,
) -> Optional[dict]:
    """Check if actual value breaches forecast confidence interval."""
    if actual > upper_bound:
        return {
            "alert_type": "forecast_breach",
            "direction": "above",
            "actual_value": actual,
            "threshold": upper_bound,
            "severity": "high",
        }
    if actual < lower_bound:
        return {
            "alert_type": "forecast_breach",
            "direction": "below",
            "actual_value": actual,
            "threshold": lower_bound,
            "severity": "low",
        }
    return None


def detect_sentiment_spike(
    sentiment_score: float,
    threshold: float = -0.7,
) -> Optional[dict]:
    """Detect negative sentiment spike."""
    if sentiment_score <= threshold:
        return {
            "alert_type": "sentiment_spike",
            "actual_value": sentiment_score,
            "threshold": threshold,
            "severity": "medium" if sentiment_score > -0.85 else "high",
        }
    return None
