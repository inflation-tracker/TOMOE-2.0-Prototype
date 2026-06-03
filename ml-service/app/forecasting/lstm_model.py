"""LSTM forecasting for commodity prices."""
import os
import random
import numpy as np
import pandas as pd
import logging

logger = logging.getLogger(__name__)

SEQUENCE_LENGTH = 30
RANDOM_SEED = 42


def _set_seeds():
    """Make training reproducible: same input → same forecast."""
    os.environ["PYTHONHASHSEED"] = str(RANDOM_SEED)
    random.seed(RANDOM_SEED)
    np.random.seed(RANDOM_SEED)
    try:
        import tensorflow as tf
        tf.random.set_seed(RANDOM_SEED)
    except Exception:
        pass


def prepare_sequences(data: np.ndarray, seq_len: int = SEQUENCE_LENGTH):
    X, y = [], []
    for i in range(len(data) - seq_len):
        X.append(data[i : i + seq_len])
        y.append(data[i + seq_len])
    return np.array(X), np.array(y)


def build_lstm_model(seq_len: int = SEQUENCE_LENGTH):
    """Build and compile LSTM model. Deferred import to avoid startup cost."""
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.optimizers import Adam

    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=(seq_len, 1)),
        Dropout(0.2),
        LSTM(32, return_sequences=False),
        Dropout(0.2),
        Dense(1),
    ])
    model.compile(optimizer=Adam(learning_rate=0.001), loss="mse")
    return model


def forecast_lstm(series: pd.Series, steps: int = 30, epochs: int = 50) -> dict:
    """Train LSTM on historical series and forecast future steps."""
    try:
        from sklearn.preprocessing import MinMaxScaler

        # Need at least one full sequence plus its target to train on.
        if len(series) <= SEQUENCE_LENGTH:
            raise ValueError(
                f"LSTM needs more than {SEQUENCE_LENGTH} points, got {len(series)}"
            )

        _set_seeds()
        values = series.values.reshape(-1, 1)
        scaler = MinMaxScaler()
        scaled = scaler.fit_transform(values)

        X, y = prepare_sequences(scaled)
        X = X.reshape(X.shape[0], X.shape[1], 1)

        model = build_lstm_model()
        model.fit(X, y, epochs=epochs, batch_size=16, verbose=0, validation_split=0.1)

        # Multi-step prediction
        last_seq = scaled[-SEQUENCE_LENGTH:].reshape(1, SEQUENCE_LENGTH, 1)
        predictions = []
        for _ in range(steps):
            pred = model.predict(last_seq, verbose=0)[0, 0]
            predictions.append(pred)
            last_seq = np.append(last_seq[:, 1:, :], [[[pred]]], axis=1)

        predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1)).flatten()

        # Confidence interval that WIDENS with the horizon. Recursive multi-step
        # forecasting accumulates error, so a flat band understates uncertainty.
        # We grow the band as sigma * sqrt(h), the random-walk error-propagation
        # rule, where sigma is the 1-step residual scale (diff std).
        sigma = float(np.nanstd(np.diff(series.values)))
        horizon_scale = np.sqrt(np.arange(1, steps + 1))
        margin = 1.96 * sigma * horizon_scale
        return {
            "model": "LSTM",
            "steps": steps,
            "predicted": predictions.tolist(),
            "lower_bound": (predictions - margin).tolist(),
            "upper_bound": (predictions + margin).tolist(),
            "mape": None,  # no holdout retrain here — ensemble/SARIMA carry MAPE
        }
    except Exception as e:
        logger.error(f"LSTM forecast failed: {e}")
        raise
