"""TOMOE 2.0 — ML Service FastAPI application."""
from fastapi import FastAPI, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Annotated, Literal, Optional
import pandas as pd
import numpy as np
import logging

from app.config import settings
from app.runtime import run_job, CapacityError, JobTimeout
from app.cache import forecast_cache, make_key, cached

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
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

_MAX = settings.max_series_length


async def require_api_key(x_api_key: Optional[str] = Header(default=None)):
    """Enforce the shared-secret API key when one is configured (no-op in dev)."""
    if settings.api_key and x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


@app.exception_handler(CapacityError)
async def _capacity_handler(request: Request, exc: CapacityError):
    return JSONResponse(status_code=503, content={"detail": "Service at capacity, retry shortly"})


@app.exception_handler(JobTimeout)
async def _timeout_handler(request: Request, exc: JobTimeout):
    return JSONResponse(status_code=504, content={"detail": "Job timed out"})


# ─── Schema ─────────────────────────────────────────────────────────────────

class ForecastRequest(BaseModel):
    series: Annotated[list[float], Field(min_length=12, max_length=_MAX)]
    steps: int = Field(default=30, ge=1, le=365)
    model: str = "ensemble"  # sarima | lstm | ensemble
    dates: Optional[list[str]] = None
    # Seasonal cycle length in samples: 7=weekly (daily data), 12=monthly,
    # None disables seasonality. Defaults to weekly for the daily price series.
    seasonal_periods: Optional[int] = Field(default=7, ge=2, le=366)

class SentimentRequest(BaseModel):
    text: Annotated[str, Field(min_length=1, max_length=5000)]
    commodity: Optional[str] = None

class BatchSentimentRequest(BaseModel):
    texts: Annotated[list[str], Field(min_length=1, max_length=512)]

class EWSRequest(BaseModel):
    series: Annotated[list[float], Field(min_length=2, max_length=_MAX)]
    current_value: float
    window: int = Field(default=30, ge=2)
    n_sigma: float = Field(default=2.0, gt=0)
    # Use the robust median+MAD detector (recommended for skewed price series).
    robust: bool = True


class BacktestRequest(BaseModel):
    series: Annotated[list[float], Field(min_length=19, max_length=_MAX)]
    horizon: int = Field(default=7, ge=1, le=90)
    initial_train_size: Optional[int] = Field(default=None, ge=12)
    step_size: int = Field(default=7, ge=1)
    max_folds: int = Field(default=12, ge=1, le=52)
    model: Literal["naive", "sarima", "ensemble"] = "sarima"
    seasonal_periods: Optional[int] = Field(default=7, ge=2, le=366)


# ─── Endpoints ──────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "TOMOE 2.0 ML Service", "version": "2.0.0", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/admin/warmup", dependencies=[Depends(require_api_key)])
async def warmup():
    """Eagerly load the heavy NLP models so the first real request is fast."""
    def _load():
        loaded = []
        try:
            from app.nlp.sentiment import load_sentiment_pipeline
            load_sentiment_pipeline()
            loaded.append("sentiment")
        except Exception as e:
            logger.warning(f"warmup sentiment failed: {e}")
        return loaded

    try:
        loaded = await run_job(_load)
    except (CapacityError, JobTimeout):
        raise
    except Exception as e:
        logger.error(f"warmup error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"warmed": loaded}


@app.post("/forecast/run", dependencies=[Depends(require_api_key)])
async def run_forecast(req: ForecastRequest):
    """Run forecasting model (SARIMA, LSTM, or Ensemble)."""
    series = pd.Series(req.series)
    # SARIMA copes with 12 points; the LSTM needs enough to build at least
    # one training sequence (see SEQUENCE_LENGTH in lstm_model).
    if req.model in ("lstm", "ensemble") and len(series) < 40:
        raise HTTPException(
            status_code=400,
            detail="Need at least 40 data points for LSTM/ensemble forecasting",
        )

    # Collapse identical repeat requests (rounded series) onto one training run.
    cache_key = make_key(req.model, req.steps, req.seasonal_periods, [round(x, 4) for x in req.series])

    def _compute():
        if req.model == "sarima":
            from app.forecasting.sarima_model import forecast_sarima
            return forecast_sarima(series, steps=req.steps, seasonal_periods=req.seasonal_periods)
        if req.model == "lstm":
            from app.forecasting.lstm_model import forecast_lstm
            return forecast_lstm(series, steps=req.steps)
        from app.forecasting.ensemble import forecast_ensemble
        return forecast_ensemble(series, steps=req.steps, seasonal_periods=req.seasonal_periods)

    try:
        result = await run_job(cached, forecast_cache, cache_key, _compute)
    except (HTTPException, CapacityError, JobTimeout):
        raise
    except Exception as e:
        logger.error(f"Forecast error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    # Generate forecast dates if not provided
    dates = req.dates or [
        (pd.Timestamp.now() + pd.Timedelta(days=i + 1)).strftime("%Y-%m-%d")
        for i in range(req.steps)
    ]
    return {**result, "dates": dates[: req.steps], "input_length": len(series)}


@app.post("/forecast/backtest", dependencies=[Depends(require_api_key)])
async def run_backtest(req: BacktestRequest):
    """Walk-forward backtest for forecast validation."""
    series = pd.Series(req.series)
    if req.model == "ensemble" and len(series) < 40:
        raise HTTPException(
            status_code=400,
            detail="Need at least 40 data points for ensemble backtesting",
        )

    def _compute():
        from app.forecasting.backtest import walk_forward_backtest
        return walk_forward_backtest(
            series,
            horizon=req.horizon,
            initial_train_size=req.initial_train_size,
            step_size=req.step_size,
            max_folds=req.max_folds,
            model=req.model,
            seasonal_periods=req.seasonal_periods,
        )

    try:
        result = await run_job(_compute)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except (CapacityError, JobTimeout):
        raise
    except Exception as e:
        logger.error(f"Backtest error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {**result, "input_length": len(series)}


@app.post("/sentiment/analyze", dependencies=[Depends(require_api_key)])
async def analyze_sentiment(req: SentimentRequest):
    """Analyze sentiment of Indonesian text using IndoBERT."""
    try:
        from app.nlp.sentiment import analyze_sentiment as _analyze
        result = await run_job(_analyze, req.text)
        return {**result, "commodity": req.commodity}
    except (CapacityError, JobTimeout):
        raise
    except Exception as e:
        logger.error(f"Sentiment error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/sentiment/batch", dependencies=[Depends(require_api_key)])
async def batch_sentiment(req: BatchSentimentRequest):
    """Batch sentiment analysis for multiple texts."""
    try:
        from app.nlp.sentiment import batch_analyze
        results = await run_job(batch_analyze, req.texts)
        return {"results": results, "count": len(results)}
    except (CapacityError, JobTimeout):
        raise
    except Exception as e:
        logger.error(f"Batch sentiment error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/topics/fit", dependencies=[Depends(require_api_key)])
async def fit_topics(documents: list[str]):
    """Fit BERTopic model on a list of documents."""
    if len(documents) < 10:
        raise HTTPException(status_code=400, detail="Need at least 10 documents for topic modeling")
    if len(documents) > settings.max_documents:
        raise HTTPException(status_code=400, detail=f"Too many documents (max {settings.max_documents})")
    try:
        from app.nlp.topic_model import fit_topics
        return await run_job(fit_topics, documents)
    except (CapacityError, JobTimeout):
        raise
    except Exception as e:
        logger.error(f"Topic modeling error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/ews/detect", dependencies=[Depends(require_api_key)])
async def detect_anomaly(req: EWSRequest):
    """Run EWS anomaly detection on a price series (cheap, runs inline)."""
    try:
        from app.ews.detector import detect_2sigma_breach, detect_robust_breach
        series = pd.Series(req.series)
        if req.robust:
            alert = detect_robust_breach(series, req.current_value, req.window, req.n_sigma)
        else:
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
        raise HTTPException(status_code=500, detail="Internal server error")
