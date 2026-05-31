"""Ensemble forecast combining SARIMA + LSTM."""
import numpy as np
import pandas as pd
from app.forecasting.sarima_model import forecast_sarima
from app.forecasting.lstm_model import forecast_lstm
import logging

logger = logging.getLogger(__name__)


def forecast_ensemble(series: pd.Series, steps: int = 30, weights=(0.4, 0.6)) -> dict:
    """
    Weighted ensemble of SARIMA and LSTM predictions.
    weights: (sarima_weight, lstm_weight)
    """
    sarima_result = forecast_sarima(series, steps=steps)
    try:
        lstm_result = forecast_lstm(series, steps=steps, epochs=50)
        use_lstm = True
    except Exception as e:
        logger.warning(f"LSTM failed, using SARIMA only: {e}")
        use_lstm = False

    sarima_pred = np.array(sarima_result["predicted"])
    sarima_lo = np.array(sarima_result["lower_bound"])
    sarima_hi = np.array(sarima_result["upper_bound"])

    if use_lstm:
        lstm_pred = np.array(lstm_result["predicted"])
        lstm_lo = np.array(lstm_result["lower_bound"])
        lstm_hi = np.array(lstm_result["upper_bound"])
        w_s, w_l = weights
        predicted = w_s * sarima_pred + w_l * lstm_pred
        lower_bound = w_s * sarima_lo + w_l * lstm_lo
        upper_bound = w_s * sarima_hi + w_l * lstm_hi
        mape = sarima_result["mape"]
    else:
        predicted = sarima_pred
        lower_bound = sarima_lo
        upper_bound = sarima_hi
        mape = sarima_result["mape"]

    return {
        "model": "Ensemble",
        "steps": steps,
        "predicted": predicted.tolist(),
        "lower_bound": lower_bound.tolist(),
        "upper_bound": upper_bound.tolist(),
        "mape": mape,
        "components": ["SARIMA"] + (["LSTM"] if use_lstm else []),
        "weights": list(weights) if use_lstm else [1.0],
    }
