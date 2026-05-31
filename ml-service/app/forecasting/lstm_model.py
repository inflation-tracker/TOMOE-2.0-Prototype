"""LSTM forecasting for commodity prices."""
import numpy as np
import pandas as pd
from typing import Optional
import logging

logger = logging.getLogger(__name__)

SEQUENCE_LENGTH = 30


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

        # Simple CI estimation using rolling std
        std = float(series.rolling(12).std().mean())
        return {
            "model": "LSTM",
            "steps": steps,
            "predicted": predictions.tolist(),
            "lower_bound": (predictions - 1.96 * std).tolist(),
            "upper_bound": (predictions + 1.96 * std).tolist(),
            "mape": None,  # would need val set
        }
    except Exception as e:
        logger.error(f"LSTM forecast failed: {e}")
        raise
