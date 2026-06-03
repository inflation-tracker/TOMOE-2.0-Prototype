"""Shared fixtures. Imports of fastapi/httpx are kept inside fixtures so that
collection still works on environments where only the numeric deps are present
(the pure-numpy tests run; the API tests importorskip fastapi)."""
import pytest


@pytest.fixture
def client():
    """A TestClient bound to the ML service app. Skips if fastapi is absent."""
    pytest.importorskip("fastapi")
    pytest.importorskip("httpx")
    from fastapi.testclient import TestClient
    from app.main import app
    return TestClient(app)
