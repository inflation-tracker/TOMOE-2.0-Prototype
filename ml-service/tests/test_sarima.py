"""SARIMA tests. Skipped entirely when statsmodels is unavailable."""
import numpy as np
import pandas as pd
import pytest

pytest.importorskip("statsmodels")

from app.forecasting.sarima_model import _compute_mape, forecast_sarima, _select_seasonal_order


def test_seasonal_order_disabled_when_too_short():
    s = pd.Series(range(10))
    # Weekly period 7 needs ≥14 points; 10 < 14 → no seasonal component.
    assert _select_seasonal_order(s, 7) == (0, 0, 0, 0)


def test_seasonal_order_enabled_with_enough_cycles():
    s = pd.Series(range(30))
    assert _select_seasonal_order(s, 7) == (1, 1, 1, 7)


def test_seasonal_order_disabled_when_none():
    s = pd.Series(range(100))
    assert _select_seasonal_order(s, None) == (0, 0, 0, 0)


def test_compute_mape_basic():
    actual = pd.Series([100.0, 200.0])
    predicted = pd.Series([110.0, 180.0])
    # |(100-110)/100| = 0.1 ; |(200-180)/200| = 0.1 ; mean*100 = 10.0
    assert _compute_mape(actual, predicted) == pytest.approx(10.0)


def test_compute_mape_ignores_zero_actuals():
    actual = pd.Series([0.0, 50.0])
    predicted = pd.Series([5.0, 55.0])
    # The zero actual is dropped; only |(50-55)/50| = 0.1 → 10.0
    assert _compute_mape(actual, predicted) == pytest.approx(10.0)


def test_forecast_sarima_smoke():
    rng = np.random.default_rng(0)
    series = pd.Series(100 + np.arange(36) * 0.5 + rng.normal(0, 1, 36))
    out = forecast_sarima(series, steps=3)
    assert out["model"] == "SARIMA"
    assert len(out["predicted"]) == 3
    assert len(out["lower_bound"]) == 3
    assert len(out["upper_bound"]) == 3
