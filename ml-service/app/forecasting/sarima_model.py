"""SARIMA forecasting for inflation and commodity prices."""
import numpy as np
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def fit_sarima(series: pd.Series, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12)) -> SARIMAX:
    """Fit SARIMA model to a time series."""
    model = SARIMAX(series, order=order, seasonal_order=seasonal_order,
                    enforce_stationarity=False, enforce_invertibility=False)
    return model.fit(disp=False)


def forecast_sarima(series: pd.Series, steps: int = 30) -> dict:
    """Generate SARIMA forecast with confidence intervals."""
    try:
        result = fit_sarima(series)
        pred = result.get_forecast(steps=steps)
        pred_mean = pred.predicted_mean
        conf_int = pred.conf_int(alpha=0.05)

        return {
            "model": "SARIMA",
            "steps": steps,
            "predicted": pred_mean.tolist(),
            "lower_bound": conf_int.iloc[:, 0].tolist(),
            "upper_bound": conf_int.iloc[:, 1].tolist(),
            "aic": result.aic,
            "mape": _compute_mape(series[-12:], result.fittedvalues[-12:]),
        }
    except Exception as e:
        logger.error(f"SARIMA forecast failed: {e}")
        raise


def _compute_mape(actual: pd.Series, predicted: pd.Series) -> float:
    actual = actual.replace(0, np.nan).dropna()
    predicted = predicted[actual.index]
    return float(np.mean(np.abs((actual - predicted) / actual)) * 100)
