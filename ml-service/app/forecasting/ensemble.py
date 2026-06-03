"""Ensemble forecast combining SARIMA + LSTM."""
import numpy as np
import pandas as pd
from app.forecasting.sarima_model import forecast_sarima
from app.forecasting.lstm_model import forecast_lstm
import logging

logger = logging.getLogger(__name__)

Z = 1.96  # 95% normal quantile


def _sigma_from_bounds(lo: np.ndarray, hi: np.ndarray) -> np.ndarray:
    """Recover a per-step standard deviation from a 95% interval."""
    return (hi - lo) / (2 * Z)


def forecast_ensemble(
    series: pd.Series, steps: int = 30, weights=(0.4, 0.6), seasonal_periods: int | None = 7
) -> dict:
    """
    Weighted ensemble of SARIMA and LSTM predictions.
    weights: (sarima_weight, lstm_weight)
    """
    sarima_result = forecast_sarima(series, steps=steps, seasonal_periods=seasonal_periods)
    try:
        lstm_result = forecast_lstm(series, steps=steps, epochs=50)
        use_lstm = True
    except Exception as e:
        logger.warning(f"LSTM failed, using SARIMA only: {e}")
        use_lstm = False

    sarima_pred = np.array(sarima_result["predicted"])
    sarima_lo = np.array(sarima_result["lower_bound"])
    sarima_hi = np.array(sarima_result["upper_bound"])

    if not use_lstm:
        return {
            "model": "Ensemble",
            "steps": steps,
            "predicted": sarima_pred.tolist(),
            "lower_bound": sarima_lo.tolist(),
            "upper_bound": sarima_hi.tolist(),
            "mape": sarima_result["mape"],
            "components": ["SARIMA"],
            "weights": [1.0],
        }

    lstm_pred = np.array(lstm_result["predicted"])
    lstm_lo = np.array(lstm_result["lower_bound"])
    lstm_hi = np.array(lstm_result["upper_bound"])
    w_s, w_l = weights

    predicted = w_s * sarima_pred + w_l * lstm_pred

    # Combine intervals via the law of total variance for a weighted mixture:
    #   Var = Σ wᵢ·σᵢ²  +  Σ wᵢ·(predᵢ − pred_ensemble)²
    # The second term injects extra uncertainty when the models DISAGREE, which
    # simple bound-averaging ignores (and thus underestimates).
    var_s = _sigma_from_bounds(sarima_lo, sarima_hi) ** 2
    var_l = _sigma_from_bounds(lstm_lo, lstm_hi) ** 2
    within = w_s * var_s + w_l * var_l
    between = w_s * (sarima_pred - predicted) ** 2 + w_l * (lstm_pred - predicted) ** 2
    sigma = np.sqrt(within + between)

    return {
        "model": "Ensemble",
        "steps": steps,
        "predicted": predicted.tolist(),
        "lower_bound": (predicted - Z * sigma).tolist(),
        "upper_bound": (predicted + Z * sigma).tolist(),
        "mape": sarima_result["mape"],
        "components": ["SARIMA", "LSTM"],
        "weights": list(weights),
    }
