"""Runtime guards for CPU-bound ML work.

FastAPI's event loop must never run a blocking model fit directly — one such
call would freeze every other request (including /health). `run_job` offloads
the work to a bounded threadpool and awaits it, so the loop stays free, while:

  * a semaphore caps concurrent heavy jobs and load-sheds the rest (503), and
  * a timeout bounds how long a caller waits (504).

Note: Python can't forcibly kill a running thread, so a timed-out job keeps
running until it finishes on its own; the semaphore is what protects the box
from pile-up. For hard cancellation, move to an out-of-process task queue
(Celery/RQ/arq) — see the project roadmap.
"""
import asyncio
import functools
from concurrent.futures import ThreadPoolExecutor

from app.config import settings


class CapacityError(Exception):
    """Raised when all heavy-job slots are busy."""


class JobTimeout(Exception):
    """Raised when a job exceeds job_timeout_seconds."""


_executor = ThreadPoolExecutor(
    max_workers=settings.max_concurrent_jobs,
    thread_name_prefix="ml-job",
)
_slots = asyncio.Semaphore(settings.max_concurrent_jobs)


async def run_job(fn, *args, **kwargs):
    """Run a blocking callable in the threadpool with capacity + timeout guards."""
    try:
        # Non-blocking acquire: reject immediately when at capacity.
        await asyncio.wait_for(_slots.acquire(), timeout=0.001)
    except asyncio.TimeoutError:
        raise CapacityError()

    loop = asyncio.get_running_loop()
    call = functools.partial(fn, *args, **kwargs)
    try:
        return await asyncio.wait_for(
            loop.run_in_executor(_executor, call),
            timeout=settings.job_timeout_seconds,
        )
    except asyncio.TimeoutError:
        raise JobTimeout()
    finally:
        _slots.release()
