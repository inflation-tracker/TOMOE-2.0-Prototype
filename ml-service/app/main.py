"""TOMOE 2.0 — ML Service FastAPI application."""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import logging

from app.config import settings

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TOMOE 2.0 ML Service",
    description="AI/ML backend for Early Inflation Detection System",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Schema ─────────────────────────────────────────────────────────────────

class ForecastRequest(BaseModel):
    series: list[float]
    steps: int = 30
    model: str = "ensemble"  # sarima | lstm | ensemble
    dates: Optional[list[str]] = None

class SentimentRequest(BaseModel):
    text: str
    commodity: Optional[str] = None

class BatchSentimentRequest(BaseModel):
    texts: list[str]

class EWSRequest(BaseModel):
    series: list[float]
    current_value: float
    window: int = 30
    n_sigma: float = 2.0


# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "TOMOE 2.0 ML Service", "version": "2.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/forecast/run")
async def run_forecast(req: ForecastRequest):
    """Run forecasting model (SARIMA, LSTM, or Ensemble)."""
    try:
        series = pd.Series(req.series)
        if len(series) < 12:
            raise HTTPException(status_code=400, detail="Need at least 12 data points for forecasting")

        if req.model == "sarima":
            from app.forecasting.sarima_model import forecast_sarima
            result = forecast_sarima(series, steps=req.steps)
        elif req.model == "lstm":
            from app.forecasting.lstm_model import forecast_lstm
            result = forecast_lstm(series, steps=req.steps)
        else:
            from app.forecasting.ensemble import forecast_ensemble
            result = forecast_ensemble(series, steps=req.steps)

        # Generate forecast dates if not provided
        dates = req.dates or [
            (pd.Timestamp.now() + pd.Timedelta(days=i + 1)).strftime("%Y-%m-%d")
            for i in range(req.steps)
        ]

        return {
            **result,
            "dates": dates[:req.steps],
            "input_length": len(series),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sentiment/analyze")
async def analyze_sentiment(req: SentimentRequest):
    """Analyze sentiment of Indonesian text using IndoBERT."""
    try:
        from app.nlp.sentiment import analyze_sentiment as _analyze
        result = _analyze(req.text)
        return {**result, "commodity": req.commodity}
    except Exception as e:
        logger.error(f"Sentiment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sentiment/batch")
async def batch_sentiment(req: BatchSentimentRequest):
    """Batch sentiment analysis for multiple texts."""
    try:
        from app.nlp.sentiment import batch_analyze
        results = batch_analyze(req.texts)
        return {"results": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Batch sentiment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/topics/fit")
async def fit_topics(documents: list[str]):
    """Fit BERTopic model on a list of documents."""
    try:
        from app.nlp.topic_model import fit_topics
        if len(documents) < 10:
            raise HTTPException(status_code=400, detail="Need at least 10 documents for topic modeling")
        return fit_topics(documents)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Topic modeling error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ews/detect")
async def detect_anomaly(req: EWSRequest):
    """Run EWS anomaly detection on a price series."""
    try:
        from app.ews.detector import detect_2sigma_breach
        series = pd.Series(req.series)
        alert = detect_2sigma_breach(series, req.current_value, req.window, req.n_sigma)
        return {
            "alert": alert,
            "has_alert": alert is not None,
            "series_stats": {
                "mean": float(series.mean()),
                "std": float(series.std()),
                "min": float(series.min()),
                "max": float(series.max()),
                "last": float(series.iloc[-1]),
            },
        }
    except Exception as e:
        logger.error(f"EWS detection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
