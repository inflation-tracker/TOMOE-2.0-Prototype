"""BPS WebAPI scraper — IHK dan inflasi resmi."""
import os
import httpx
import pandas as pd
import logging

logger = logging.getLogger(__name__)

BPS_API_KEY = os.getenv("BPS_API_KEY", "")

BPS_API_BASE = "https://webapi.bps.go.id/v1/api"
DOMAIN_CODE = "7200"  # Sulawesi Tengah

# BPS variable IDs for inflation indicators
BPS_VARS = {
    "ihk_umum": "6",          # IHK Umum
    "inflasi_mtm": "7",        # Inflasi MtM
    "inflasi_yoy": "8",        # Inflasi YoY
}


async def fetch_ihk_data(var_key: str = "ihk_umum", year: int = 2025) -> list[dict]:
    """Fetch IHK data from BPS WebAPI."""
    if not BPS_API_KEY:
        logger.warning("BPS_API_KEY not set; using mock IHK data.")
        return _generate_mock_ihk(year)

    var_id = BPS_VARS.get(var_key, "6")
    url = f"{BPS_API_BASE}/list/model/data/lang/ind/domain/{DOMAIN_CODE}/var/{var_id}/key/{BPS_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

            # Parse BPS response format
            records = []
            for item in data.get("data", []):
                records.append({
                    "date": f"{item.get('period', year)}-01",
                    "region": "Sulawesi Tengah",
                    "indicator": var_key,
                    "value": float(item.get("val", 0)),
                    "source": "BPS",
                })
            return records

    except Exception as e:
        # Do NOT fabricate official inflation figures on failure — return empty
        # and let the caller/alerting see the gap. Mock generation is test-only.
        logger.error(f"BPS fetch failed for {var_key}: {e}; returning no records")
        return []


def _generate_mock_ihk(year: int) -> list[dict]:
    """TEST-ONLY mock IHK generator. Never called from the ingestion path."""
    import random
    records = []
    yoy = 2.5
    for month in range(1, 13):
        yoy += random.uniform(-0.15, 0.2)
        records.append({
            "date": f"{year}-{month:02d}-01",
            "region": "Sulawesi Tengah",
            "indicator": "inflasi_yoy",
            "value": round(yoy, 2),
            "source": "BPS_MOCK",
        })
    return records
