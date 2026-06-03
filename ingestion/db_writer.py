"""Idempotent writer for ingested commodity prices.

Uses INSERT ... ON CONFLICT so re-running an ingestion (same day, same market)
updates rather than errors or duplicates — safe to retry/backfill. Every batch
goes through the data-quality gate first.
"""
import logging
import os
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import execute_values

from ingestion.quality import validate_price_records

logger = logging.getLogger(__name__)

# Scraper commodity key → seed `commodities.code`.
COMMODITY_CODE_MAP = {
    "beras_premium": "BERAS_PREM",
    "cabai_merah": "CABAI_MERAH",
    "bawang_merah": "BAWANG_MRH",
    "minyak_goreng": "MINYAK_GOR",
    "daging_sapi": "DAGING_SPI",
    "telur_ayam": "TELUR_AYAM",
    "gula_pasir": "GULA_PASIR",
}
DEFAULT_MARKET_SOURCE = "PIHPS"


def _connect():
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL not set — cannot write ingestion output")
    return psycopg2.connect(dsn)


def _parse_ts(value: str) -> datetime:
    """Parse an ISO date/datetime into a UTC-aware timestamp."""
    dt = datetime.fromisoformat(value)
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def write_commodity_prices(records: list[dict], lock_key: int | None = None) -> dict:
    """Validate and upsert price records. Returns counts for observability.

    lock_key: when set, takes a Postgres advisory lock on the same connection
    before writing. If another process already holds it, this run is skipped —
    preventing two scheduler instances from double-ingesting. The lock is
    released automatically when the connection closes.
    """
    valid, rejected = validate_price_records(records)
    if rejected:
        reasons = ", ".join(sorted({r["_reject"] for r in rejected}))
        logger.warning("DQ rejected %d/%d price records (%s)", len(rejected), len(records), reasons)
    if not valid:
        return {"written": 0, "rejected": len(rejected), "skipped": 0}

    conn = _connect()
    try:
        if lock_key is not None:
            with conn.cursor() as cur:
                cur.execute("SELECT pg_try_advisory_lock(%s)", (lock_key,))
                if not cur.fetchone()[0]:
                    logger.info("Advisory lock %s held elsewhere; skipping write", lock_key)
                    return {"written": 0, "rejected": len(rejected), "skipped": 0, "locked": True}
        with conn, conn.cursor() as cur:
            cur.execute("SELECT code, id FROM commodities")
            code_to_id = {code: cid for code, cid in cur.fetchall()}
            cur.execute(
                "SELECT id FROM markets WHERE source = %s ORDER BY id LIMIT 1",
                (DEFAULT_MARKET_SOURCE,),
            )
            row = cur.fetchone()
            if row is None:
                raise RuntimeError("No PIHPS market seeded; run db/seed.sql first")
            market_id = row[0]

            rows, skipped = [], 0
            for r in valid:
                code = COMMODITY_CODE_MAP.get(r["commodity"])
                commodity_id = code_to_id.get(code)
                if commodity_id is None:
                    logger.warning("Unmapped commodity %r; skipping", r["commodity"])
                    skipped += 1
                    continue
                rows.append((
                    _parse_ts(r["date"]),
                    commodity_id,
                    market_id,
                    float(r["price"]),
                    r.get("price_change"),
                    r.get("source", "PIHPS"),
                ))

            if not rows:
                return {"written": 0, "rejected": len(rejected), "skipped": skipped}

            execute_values(
                cur,
                """
                INSERT INTO commodity_prices
                    (time, commodity_id, market_id, price, price_change, source)
                VALUES %s
                ON CONFLICT (time, commodity_id, market_id) DO UPDATE
                    SET price = EXCLUDED.price,
                        price_change = EXCLUDED.price_change,
                        source = EXCLUDED.source
                """,
                rows,
            )
        logger.info("Upserted %d price rows (%d rejected, %d skipped)", len(rows), len(rejected), skipped)
        return {"written": len(rows), "rejected": len(rejected), "skipped": skipped}
    finally:
        conn.close()
