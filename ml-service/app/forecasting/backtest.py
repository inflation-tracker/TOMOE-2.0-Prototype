"""Walk-forward backtesting for TOMOE forecast models."""
from __future__ import annotations

import logging
from collections.abc import Callable
from typing import Literal

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

ForecastModel = Literal["naive", "sarima", "ensemble"]
Forecaster = Callable[[pd.Series, int], list[float]]


def _mape(actual: pd.Series, predicted: pd.Series) -> float | None:
    """Mean absolute percentage error, ignoring zero actuals."""
    mask = actual != 0
    if not bool(mask.any()):
        return None
    a = actual[mask].astype(float)
    p = predicted[mask].astype(float)
    return float(np.mean(np.abs((a - p) / a)) * 100)


def _mae(actual: pd.Series, predicted: pd.Series) -> float:
    return float(np.mean(np.abs(actual.astype(float) - predicted.astype(float))))


def _rmse(actual: pd.Series, predicted: pd.Series) -> float:
    err = actual.astype(float) - predicted.astype(float)
    return float(np.sqrt(np.mean(err**2)))


def _default_forecaster(
    model: ForecastModel,
    seasonal_periods: int | None,
) -> Forecaster:
    if model == "naive":
        return lambda train, steps: [float(train.iloc[-1])] * steps
    if model == "sarima":
        def _sarima(train: pd.Series, steps: int) -> list[float]:
            from app.forecasting.sarima_model import forecast_sarima
            return forecast_sarima(train, steps=steps, seasonal_periods=seasonal_periods)["predicted"]
        return _sarima
    if model == "ensemble":
        def _ensemble(train: pd.Series, steps: int) -> list[float]:
            from app.forecasting.ensemble import forecast_ensemble
            return forecast_ensemble(train, steps=steps, seasonal_periods=seasonal_periods)["predicted"]
        return _ensemble
    raise ValueError(f"Unsupported forecast model: {model}")


def walk_forward_backtest(
    series: pd.Series,
    *,
    horizon: int = 7,
    initial_train_size: int | None = None,
    step_size: int = 7,
    max_folds: int = 12,
    model: ForecastModel = "sarima",
    seasonal_periods: int | None = 7,
    forecaster: Forecaster | None = None,
) -> dict:
    """Evaluate a forecast model on rolling historical holdouts.

    Each fold trains on observations before a cutoff, forecasts the next
    `horizon` points, and scores against the hidden actuals. The default
    `step_size=7` gives weekly folds for daily PIHPS data.
    """
    clean = pd.Series(series, dtype="float64").dropna().reset_index(drop=True)
    if horizon < 1:
        raise ValueError("horizon must be at least 1")
    if step_size < 1:
        raise ValueError("step_size must be at least 1")
    if max_folds < 1:
        raise ValueError("max_folds must be at least 1")
    if len(clean) < horizon + 12:
        raise ValueError("series is too short for walk-forward backtesting")

    max_cutoff = len(clean) - horizon
    if initial_train_size is None:
        initial_train_size = max(12, len(clean) - horizon * max_folds)
    if initial_train_size < 12:
        raise ValueError("initial_train_size must be at least 12")
    if initial_train_size > max_cutoff:
        raise ValueError("initial_train_size leaves no holdout window")

    cutoffs = list(range(initial_train_size, max_cutoff + 1, step_size))
    cutoffs = cutoffs[-max_folds:]
    forecast_fn = forecaster or _default_forecaster(model, seasonal_periods)

    folds: list[dict] = []
    for cutoff in cutoffs:
        train = clean.iloc[:cutoff]
        actual = clean.iloc[cutoff : cutoff + horizon].reset_index(drop=True)
        predicted = pd.Series(forecast_fn(train, horizon), dtype="float64").reset_index(drop=True)
        if len(predicted) != len(actual):
            raise ValueError("forecaster returned an unexpected number of predictions")

        folds.append({
            "cutoff_index": cutoff,
            "train_size": len(train),
            "horizon": horizon,
            "mape": _mape(actual, predicted),
            "mae": _mae(actual, predicted),
            "rmse": _rmse(actual, predicted),
            "actual": actual.tolist(),
            "predicted": predicted.tolist(),
        })

    mape_values = [f["mape"] for f in folds if f["mape"] is not None]
    mae_values = [f["mae"] for f in folds]
    rmse_values = [f["rmse"] for f in folds]
    return {
        "model": model.upper() if model != "naive" else "NAIVE",
        "folds": folds,
        "fold_count": len(folds),
        "horizon": horizon,
        "step_size": step_size,
        "initial_train_size": initial_train_size,
        "seasonal_periods": seasonal_periods,
        "metrics": {
            "mape": float(np.mean(mape_values)) if mape_values else None,
            "mae": float(np.mean(mae_values)),
            "rmse": float(np.mean(rmse_values)),
        },
    }
