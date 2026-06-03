"""API-level tests via FastAPI TestClient.

Skipped when fastapi/httpx aren't installed (host); runs in the ml-service
container. These exercise routing, input validation, and the optional API-key
auth WITHOUT triggering model loads — /ews/detect on a short series takes the
cheap path (no breach), and validation errors short-circuit before any handler.
"""
import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}


def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "running"


def test_forecast_rejects_too_short_series(client):
    # series shorter than the min_length=12 constraint → 422 before the handler.
    res = client.post("/forecast/run", json={"series": [1.0, 2.0, 3.0]})
    assert res.status_code == 422


def test_forecast_backtest_naive(client):
    series = [100.0 + i for i in range(40)]
    res = client.post(
        "/forecast/backtest",
        json={
            "series": series,
            "model": "naive",
            "horizon": 3,
            "initial_train_size": 24,
            "step_size": 3,
            "max_folds": 4,
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["model"] == "NAIVE"
    assert body["fold_count"] == 4
    assert body["input_length"] == len(series)
    assert body["metrics"]["mape"] is not None


def test_ews_detect_short_series_no_alert(client):
    res = client.post("/ews/detect", json={"series": [1.0, 2.0, 3.0, 4.0, 5.0], "current_value": 4.0})
    assert res.status_code == 200
    body = res.json()
    assert body["has_alert"] is False
    assert "series_stats" in body


# ─── Optional API-key auth ───────────────────────────────────────────────────

def test_auth_rejects_missing_key_when_configured(client, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "api_key", "s3cret")
    res = client.post("/ews/detect", json={"series": [1.0, 2.0], "current_value": 1.0})
    assert res.status_code == 401


def test_auth_accepts_valid_key(client, monkeypatch):
    from app.config import settings
    monkeypatch.setattr(settings, "api_key", "s3cret")
    res = client.post(
        "/ews/detect",
        json={"series": [1.0, 2.0, 3.0, 4.0, 5.0], "current_value": 4.0},
        headers={"X-API-Key": "s3cret"},
    )
    assert res.status_code == 200
