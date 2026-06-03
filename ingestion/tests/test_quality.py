"""Tests for the ingestion data-quality gate."""
from ingestion.quality import price_reject_reason, validate_price_records


def _rec(**over):
    base = {"commodity": "beras_premium", "date": "2026-06-03", "price": 14800}
    base.update(over)
    return base


def test_valid_record_passes():
    assert price_reject_reason(_rec()) is None


def test_zero_price_rejected():
    # The exact failure mode of the old PIHPS scraper: HTML response → price 0.
    assert price_reject_reason(_rec(price=0)) == "non_positive_price"


def test_null_price_rejected():
    assert price_reject_reason(_rec(price=None)) == "null_price"


def test_non_numeric_price_rejected():
    assert price_reject_reason(_rec(price="abc")) == "non_numeric_price"


def test_out_of_range_rejected():
    assert price_reject_reason(_rec(price=999_999_999)) == "out_of_range"


def test_missing_fields_rejected():
    assert price_reject_reason(_rec(commodity="")) == "missing_commodity"
    assert price_reject_reason(_rec(date="")) == "missing_date"


def test_validate_splits_valid_and_rejected():
    records = [_rec(), _rec(price=0), _rec(price=29000)]
    valid, rejected = validate_price_records(records)
    assert len(valid) == 2
    assert len(rejected) == 1
    assert rejected[0]["_reject"] == "non_positive_price"
