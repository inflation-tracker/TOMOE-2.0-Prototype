"""ETL scheduler — runs ingestion jobs on schedule."""
import asyncio
import logging
from datetime import date
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)


async def job_ingest_pihps():
    """Daily PIHPS price ingestion — runs at 06:00 WITA (UTC+8 → UTC-1)."""
    from ingestion.scrapers.pihps_scraper import fetch_pihps_prices
    logger.info("Starting PIHPS ingestion...")
    try:
        records = await fetch_pihps_prices(date.today())
        logger.info(f"PIHPS: fetched {len(records)} price records")
        # TODO: write to PostgreSQL
    except Exception as e:
        logger.error(f"PIHPS ingestion failed: {e}")


async def job_ingest_bps():
    """Monthly BPS IHK ingestion — runs on 1st of month."""
    from ingestion.scrapers.bps_scraper import fetch_ihk_data
    logger.info("Starting BPS IHK ingestion...")
    try:
        records = await fetch_ihk_data()
        logger.info(f"BPS: fetched {len(records)} IHK records")
    except Exception as e:
        logger.error(f"BPS ingestion failed: {e}")


async def job_scrape_news():
    """News sentiment scraping — runs every 15 minutes."""
    logger.info("Starting news scraping...")
    # TODO: implement news scraper + IndoBERT pipeline


def start_scheduler():
    scheduler = AsyncIOScheduler(timezone="Asia/Makassar")

    # PIHPS: daily at 06:00 WITA (= 22:00 UTC previous day)
    scheduler.add_job(job_ingest_pihps, CronTrigger(hour=22, minute=0))

    # BPS: 1st of each month at 07:00 WITA
    scheduler.add_job(job_ingest_bps, CronTrigger(day=1, hour=23, minute=0))

    # News: every 15 minutes
    scheduler.add_job(job_scrape_news, CronTrigger(minute="*/15"))

    scheduler.start()
    logger.info("ETL scheduler started")
    return scheduler


if __name__ == "__main__":
    scheduler = start_scheduler()
    try:
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        scheduler.shutdown()
