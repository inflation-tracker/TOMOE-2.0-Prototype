"""PIHPS BI scraper — Pusat Informasi Harga Pangan Strategis."""
import httpx
import pandas as pd
from datetime import date
import logging

logger = logging.getLogger(__name__)

PIHPS_BASE = "https://hargapangan.id/tabel-harga/pasar-tradisional/daerah"

COMMODITY_IDS = {
    "beras_premium": 1,
    "cabai_merah": 4,
    "bawang_merah": 6,
    "minyak_goreng": 10,
    "daging_sapi": 14,
    "telur_ayam": 17,
    "gula_pasir": 20,
}

REGION_CODE = "sulawesi-tengah"


async def fetch_pihps_prices(target_date: date = None) -> list[dict]:
    """
    Fetch commodity prices from PIHPS BI for Sulawesi Tengah.
    Returns only successfully-fetched, parseable records.

    On any per-commodity failure we log and SKIP — we never fabricate a price.
    Synthetic data in an inflation early-warning pipeline can trigger or mask a
    real alert, so mock generation lives in tests only (see _generate_mock_price).
    The data-quality gate (ingestion.quality) drops anything malformed (e.g. a
    price of 0 from an unparseable HTML response) before it reaches the DB.
    """
    target = target_date or date.today()
    records = []

    async with httpx.AsyncClient(timeout=30) as client:
        for commodity_name, commodity_id in COMMODITY_IDS.items():
            try:
                # PIHPS uses form-based requests; this simulates the API pattern
                url = f"{PIHPS_BASE}/{REGION_CODE}/{commodity_id}"
                params = {"date": target.strftime("%Y-%m-%d")}
                resp = await client.get(url, params=params)
                resp.raise_for_status()

                content_type = resp.headers.get("content-type", "")
                if "json" not in content_type:
                    # Real PIHPS returns HTML for this endpoint; an HTML parser is
                    # still TODO, so skip rather than store a placeholder 0.
                    logger.warning("Non-JSON response for %s; skipping until HTML parser lands", commodity_name)
                    continue
                data = resp.json()

                records.append({
                    "date": target.isoformat(),
                    "commodity": commodity_name,
                    "price": data.get("price"),
                    "unit": data.get("unit", "kg"),
                    "source": "PIHPS",
                    "region": REGION_CODE,
                })
            except Exception as e:
                logger.warning(f"Failed to fetch {commodity_name}: {e}; skipping")

    return records


def _generate_mock_price(commodity: str, target_date: date) -> dict:
    """TEST-ONLY mock price generator. Never called from the ingestion path."""
    import random
    base_prices = {
        "beras_premium": 14800, "cabai_merah": 55000,
        "bawang_merah": 38000, "minyak_goreng": 18500,
        "daging_sapi": 145000, "telur_ayam": 29000, "gula_pasir": 16500,
    }
    base = base_prices.get(commodity, 10000)
    price = base * (1 + random.uniform(-0.05, 0.05))
    return {
        "date": target_date.isoformat(),
        "commodity": commodity,
        "price": round(price),
        "unit": "kg",
        "source": "PIHPS_MOCK",
        "region": REGION_CODE,
    }
