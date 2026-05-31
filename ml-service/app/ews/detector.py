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
