"""A tiny thread-safe TTL + LRU cache for expensive, deterministic results.

The forecasting endpoints retrain a model on every call. Until models are
persisted in a registry, this at least collapses *identical* repeat requests
(e.g. a dashboard polling the same series) into one training run.
"""
import hashlib
import json
import threading
import time
from collections import OrderedDict
from typing import Any, Callable, Optional


class TTLCache:
    def __init__(self, maxsize: int = 128, ttl: float = 300.0):
        self.maxsize = maxsize
        self.ttl = ttl
        self._store: "OrderedDict[str, tuple[float, Any]]" = OrderedDict()
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            item = self._store.get(key)
            if item is None:
                return None
            expires_at, value = item
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            self._store.move_to_end(key)
            return value

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._store[key] = (time.monotonic() + self.ttl, value)
            self._store.move_to_end(key)
            while len(self._store) > self.maxsize:
                self._store.popitem(last=False)


def make_key(*parts: Any) -> str:
    """Stable hash key from JSON-serializable parts (floats rounded for reuse)."""
    payload = json.dumps(parts, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()


forecast_cache = TTLCache(maxsize=256, ttl=300.0)


def cached(cache: TTLCache, key: str, producer: Callable[[], Any]) -> Any:
    hit = cache.get(key)
    if hit is not None:
        return hit
    value = producer()
    cache.set(key, value)
    return value
