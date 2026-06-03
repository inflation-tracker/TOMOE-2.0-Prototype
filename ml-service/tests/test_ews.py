"""Unit tests for the Early Warning System detector (pure numpy/pandas)."""
import pandas as pd

from app.ews.detector import (
    compute_zscore_threshold,
    detect_2sigma_breach,
    detect_robust_breach,
    detect_forecast_breach,
    detect_sentiment_spike,
)


def _series(n=40):
    # A deterministic, mildly varying series so sigma > 0.
    return pd.Series([float(i % 10) for i in range(n)])


# ─── compute_zscore_threshold ────────────────────────────────────────────────

def test_zscore_threshold_returns_ordered_bounds():
    lower, upper = compute_zscore_threshold(_series(), window=30)
    assert lower < upper


# ─── detect_2sigma_breach ────────────────────────────────────────────────────

def test_2sigma_none_when_series_shorter_than_window():
    short = pd.Series([1.0, 2.0, 3.0])
    assert detect_2sigma_breach(short, current_value=99.0, window=30) is None


def test_2sigma_breach_above():
    alert = detect_2sigma_breach(_series(), current_value=1000.0, window=30)
    assert alert is not None
    assert alert["alert_type"] == "2sigma"
    assert alert["direction"] == "above"
    assert alert["actual_value"] == 1000.0


def test_2sigma_breach_below_is_medium():
    alert = detect_2sigma_breach(_series(), current_value=-1000.0, window=30)
    assert alert is not None
    assert alert["direction"] == "below"
    assert alert["severity"] == "medium"


def test_2sigma_no_breach_near_mean():
    s = _series()
    mu = s.rolling(30).mean().iloc[-1]
    assert detect_2sigma_breach(s, current_value=float(mu), window=30) is None


# ─── detect_robust_breach (median + MAD) ─────────────────────────────────────

def test_robust_none_when_series_shorter_than_window():
    short = pd.Series([100.0, 101.0, 99.0])
    assert detect_robust_breach(short, current_value=99.0, window=30) is None


def test_robust_breach_above_on_price_spike():
    # Stable prices around 14_800; a jump to 30_000 must trip the robust band.
    s = pd.Series([14800.0 + (i % 5) * 10 for i in range(40)])
    alert = detect_robust_breach(s, current_value=30000.0, window=30)
    assert alert is not None
    assert alert["alert_type"] == "robust_mad"
    assert alert["direction"] == "above"


def test_robust_no_breach_within_normal_range():
    s = pd.Series([14800.0 + (i % 5) * 10 for i in range(40)])
    assert detect_robust_breach(s, current_value=14820.0, window=30) is None


# ─── detect_forecast_breach ──────────────────────────────────────────────────

def test_forecast_breach_above_is_high():
    alert = detect_forecast_breach(actual=150.0, upper_bound=100.0, lower_bound=50.0)
    assert alert == {
        "alert_type": "forecast_breach",
        "direction": "above",
        "actual_value": 150.0,
        "threshold": 100.0,
        "severity": "high",
    }


def test_forecast_breach_below_is_low():
    alert = detect_forecast_breach(actual=10.0, upper_bound=100.0, lower_bound=50.0)
    assert alert["direction"] == "below"
    assert alert["severity"] == "low"


def test_forecast_no_breach_within_band():
    assert detect_forecast_breach(actual=75.0, upper_bound=100.0, lower_bound=50.0) is None


# ─── detect_sentiment_spike ──────────────────────────────────────────────────

def test_sentiment_spike_high_below_minus_085():
    alert = detect_sentiment_spike(-0.9)
    assert alert is not None
    assert alert["severity"] == "high"


def test_sentiment_spike_medium_between_thresholds():
    alert = detect_sentiment_spike(-0.75)
    assert alert is not None
    assert alert["severity"] == "medium"


def test_sentiment_no_spike_above_threshold():
    assert detect_sentiment_spike(-0.5) is None
