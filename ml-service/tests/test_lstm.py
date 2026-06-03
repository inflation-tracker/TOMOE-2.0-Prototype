"""Tests for the LSTM helpers that don't require TensorFlow.

`prepare_sequences` is pure numpy, and the short-series guard in
`forecast_lstm` fires before any TensorFlow import — so both run cheaply.
"""
import numpy as np
import pandas as pd
import pytest

from app.forecasting.lstm_model import prepare_sequences, forecast_lstm, SEQUENCE_LENGTH


def test_prepare_sequences_shapes():
    data = np.arange(35, dtype=float).reshape(-1, 1)
    X, y = prepare_sequences(data, seq_len=30)
    assert X.shape == (5, 30, 1)
    assert y.shape == (5, 1)


def test_prepare_sequences_empty_when_too_short():
    data = np.arange(20, dtype=float).reshape(-1, 1)
    X, y = prepare_sequences(data, seq_len=30)
    assert len(X) == 0
    assert len(y) == 0


def test_forecast_lstm_rejects_short_series():
    short = pd.Series(np.arange(SEQUENCE_LENGTH, dtype=float))  # exactly seq_len → too short
    with pytest.raises(ValueError):
        forecast_lstm(short, steps=3)
