"""SARIMA forecasting for inflation and commodity prices."""
import numpy as np
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
import logging

logger = logging.getLogger(__name__)

DEFAULT_ORDER = (1, 1, 1)


def _select_seasonal_order(series: pd.Series, seasonal_periods: int | None):
    """Only engage the seasonal component when we have ≥2 full cycles of data.

    The previous code hardcoded a *monthly* period (12) which is wrong for the
    daily PIHPS price series — for daily data weekly seasonality (7) is the
    sensible default. When there isn't enough data, fall back to a plain ARIMA
    (no seasonal term) instead of fitting garbage.
    """
    if seasonal_periods and seasonal_periods > 1 and len(series) >= 2 * seasonal_periods:
        return (1, 1, 1, seasonal_periods)
    return (0, 0, 0, 0)


def fit_sarima(series: pd.Series, order=DEFAULT_ORDER, seasonal_order=(0, 0, 0, 0)) -> SARIMAX:
    """Fit a SARIMA model to a time series."""
    model = SARIMAX(
        series, order=order, seasonal_order=seasonal_order,
        enforce_stationarity=False, enforce_invertibility=False,
    )
    return model.fit(disp=False)


def forecast_sarima(series: pd.Series, steps: int = 30, seasonal_periods: int | None = 7) -> dict:
    """Generate a SARIMA forecast with confidence intervals.

    seasonal_periods: cycle length in samples (7 = weekly for daily data,
    12 = monthly for monthly data). Pass None to disable seasonality.
    """
    try:
        order = DEFAULT_ORDER
        seasonal_order = _select_seasonal_order(series, seasonal_periods)
        result = fit_sarima(series, order, seasonal_order)
        pred = result.get_forecast(steps=steps)
        pred_mean = pred.predicted_mean
        conf_int = pred.conf_int(alpha=0.05)

        return {
            "model": "SARIMA",
            "steps": steps,
            "predicted": pred_mean.tolist(),
            "lower_bound": conf_int.iloc[:, 0].tolist(),
            "upper_bound": conf_int.iloc[:, 1].tolist(),
            "aic": float(result.aic),
            # Honest out-of-sample accuracy (not the in-sample fit).
            "mape": _holdout_mape(series, order, seasonal_order),
            "mape_method": "walk_forward_holdout",
            "seasonal_periods": seasonal_order[3] or None,
        }
    except Exception as e:
        logger.error(f"SARIMA forecast failed: {e}")
        raise


def _holdout_mape(series: pd.Series, order, seasonal_order, horizon: int = 14) -> float | None:
    """Walk-forward MAPE: fit on all but the last `horizon` points, forecast
    them, and score against the held-out actuals. Returns None when the series
    is too short to leave a meaningful holdout."""
    horizon = min(horizon, max(1, len(series) // 5))
    if len(series) <= horizon + 10:
        return None
    train = series.iloc[:-horizon]
    test = series.iloc[-horizon:]
    try:
        res = fit_sarima(train, order, seasonal_order)
        fc = res.get_forecast(steps=horizon).predicted_mean
        # Re-index both to positional RangeIndex so MAPE aligns by position.
        return _compute_mape(test.reset_index(drop=True), pd.Series(fc.values))
    except Exception as e:
        logger.warning(f"holdout MAPE failed: {e}")
        return None


def _compute_mape(actual: pd.Series, predicted: pd.Series) -> float:
    actual = actual.replace(0, np.nan).dropna()
    predicted = predicted[actual.index]
    return float(np.mean(np.abs((actual - predicted) / actual)) * 100)
