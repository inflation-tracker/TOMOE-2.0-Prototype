"""Data-quality gate for ingested records.

For an inflation early-warning system, fabricated or malformed prices must NEVER
reach the warehouse — a bad value can trigger or suppress a real alert. Every
record passes these checks before any write; rejects are returned (with a
reason) for logging, not silently dropped or replaced with mock data.
"""
import logging

logger = logging.getLogger(__name__)

# Plausible per-unit price bounds in IDR (a kg of rice ~15k, a cow's-worth of
# beef per kg ~150k; nothing legitimate is < 100 or > 100M).
PRICE_MIN = 100.0
PRICE_MAX = 100_000_000.0


def price_reject_reason(record: dict) -> str | None:
    """Return a rejection reason string, or None if the record is valid."""
    if not record.get("commodity"):
        return "missing_commodity"
    if not record.get("date"):
        return "missing_date"
    price = record.get("price")
    if price is None:
        return "null_price"
    try:
        price = float(price)
    except (TypeError, ValueError):
        return "non_numeric_price"
    if price <= 0:
        return "non_positive_price"
    if not (PRICE_MIN <= price <= PRICE_MAX):
        return "out_of_range"
    return None


def validate_price_records(records: list[dict]) -> tuple[list[dict], list[dict]]:
    """Split records into (valid, rejected). Rejected carry a `_reject` reason."""
    valid, rejected = [], []
    for r in records:
        reason = price_reject_reason(r)
        if reason:
            rejected.append({**r, "_reject": reason})
        else:
            valid.append(r)
    return valid, rejected
