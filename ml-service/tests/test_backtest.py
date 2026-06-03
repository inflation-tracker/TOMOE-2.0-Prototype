"""Tests for walk-forward forecast backtesting."""
import pandas as pd
import pytest

from app.forecasting.backtest import walk_forward_backtest


def test_walk_forward_backtest_naive_metrics_shape():
    series = pd.Series([100.0 + i for i in range(40)])
    out = walk_forward_backtest(
        series,
        model="naive",
        horizon=3,
        initial_train_size=24,
        step_size=3,
        max_folds=4,
    )
    assert out["model"] == "NAIVE"
    assert out["fold_count"] == 4
    assert out["metrics"]["mape"] is not None
    assert out["metrics"]["mae"] > 0
    assert out["metrics"]["rmse"] > 0
    assert len(out["folds"][0]["actual"]) == 3
    assert len(out["folds"][0]["predicted"]) == 3


def test_walk_forward_backtest_allows_injected_forecaster():
    series = pd.Series([10.0] * 30)

    def perfect_forecaster(train, steps):
        return [10.0] * steps

    out = walk_forward_backtest(
        series,
        model="sarima",
        horizon=2,
        initial_train_size=20,
        forecaster=perfect_forecaster,
    )
    assert out["metrics"]["mape"] == pytest.approx(0.0)
    assert out["metrics"]["mae"] == pytest.approx(0.0)
    assert out["metrics"]["rmse"] == pytest.approx(0.0)


def test_walk_forward_backtest_rejects_short_series():
    with pytest.raises(ValueError, match="too short"):
        walk_forward_backtest(pd.Series([1.0] * 10), model="naive")
