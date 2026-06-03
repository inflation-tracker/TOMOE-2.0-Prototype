"""ETL scheduler — runs ingestion jobs on schedule.

Hardened for production:
  * Persistent SQLAlchemy jobstore (jobs survive restarts) when DATABASE_URL is
    set; falls back to in-memory for local dev.
  * coalesce + misfire_grace_time so a missed run catches up once, not N times.
  * max_instances=1 so a slow job never overlaps itself.
  * Postgres advisory lock inside the writer so two scheduler *processes* can't
    double-ingest.
  * An error-event listener that logs every job failure (alerting hook).
"""
import asyncio
import logging
import os
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.events import EVENT_JOB_ERROR, EVENT_JOB_MISSED

logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

# Stable advisory-lock keys per job (arbitrary but constant).
LOCK_PIHPS = 720001


async def job_ingest_pihps():
    """Daily PIHPS price ingestion — runs at 06:00 WITA (scheduler tz=Asia/Makassar)."""
    from ingestion.scrapers.pihps_scraper import fetch_pihps_prices
    from ingestion.db_writer import write_commodity_prices
    logger.info("Starting PIHPS ingestion...")
    records = await fetch_pihps_prices(date.today())
    logger.info("PIHPS: fetched %d price records", len(records))
    # DB write is blocking psycopg2 — run off the event loop, with a cross-process lock.
    result = await asyncio.to_thread(write_commodity_prices, records, LOCK_PIHPS)
    logger.info("PIHPS write result: %s", result)


async def job_ingest_bps():
    """Monthly BPS IHK ingestion — runs on 1st of month."""
    from ingestion.scrapers.bps_scraper import fetch_ihk_data
    logger.info("Starting BPS IHK ingestion...")
    records = await fetch_ihk_data()
    logger.info("BPS: fetched %d IHK records", len(records))
    # TODO: persist IHK to inflation_index once the BPS parser is finalized.


async def job_scrape_news():
    """News sentiment scraping — runs every 15 minutes."""
    logger.info("Starting news scraping...")
    # TODO: implement news scraper + IndoBERT pipeline


def _on_job_event(event):
    if event.exception:
        logger.error("Job %s FAILED: %s", event.job_id, event.exception)
    else:
        logger.warning("Job %s missed its scheduled run", event.job_id)


def _build_jobstores():
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        logger.warning("DATABASE_URL not set — using in-memory jobstore (dev only)")
        return None
    from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
    return {"default": SQLAlchemyJobStore(url=dsn)}


def start_scheduler():
    jobstores = _build_jobstores()
    scheduler = AsyncIOScheduler(
        timezone="Asia/Makassar",
        jobstores=jobstores or {},
        job_defaults={
            "coalesce": True,          # collapse multiple missed runs into one
            "misfire_grace_time": 3600,  # still run if up to 1h late
            "max_instances": 1,        # never overlap a job with itself
        },
    )
    scheduler.add_listener(_on_job_event, EVENT_JOB_ERROR | EVENT_JOB_MISSED)

    # Triggers are interpreted in the scheduler timezone (WITA) — local wall-clock.
    # replace_existing keeps a persistent jobstore from accumulating duplicates.
    scheduler.add_job(job_ingest_pihps, CronTrigger(hour=6, minute=0),
                      id="ingest_pihps", replace_existing=True)
    scheduler.add_job(job_ingest_bps, CronTrigger(day=1, hour=7, minute=0),
                      id="ingest_bps", replace_existing=True)
    scheduler.add_job(job_scrape_news, CronTrigger(minute="*/15"),
                      id="scrape_news", replace_existing=True)

    scheduler.start()
    logger.info("ETL scheduler started")
    return scheduler


async def _run_forever():
    """Start the scheduler inside a running loop and block until cancelled."""
    scheduler = start_scheduler()
    try:
        await asyncio.Event().wait()  # sleep forever
    finally:
        scheduler.shutdown()


if __name__ == "__main__":
    try:
        asyncio.run(_run_forever())
    except KeyboardInterrupt:
        logger.info("Scheduler stopped")
