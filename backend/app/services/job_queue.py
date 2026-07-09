"""Async job queue for long-running generation tasks."""
import asyncio
import logging
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Coroutine, Optional
from uuid import uuid4, UUID

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Job:
    """Represents a single background job."""

    def __init__(self, job_id: str, name: str, coro: Coroutine):
        self.id = job_id
        self.name = name
        self.coro = coro
        self.status = JobStatus.PENDING
        self.result: Any = None
        self.error: Optional[str] = None
        self.created_at = datetime.now(timezone.utc)
        self.completed_at: Optional[datetime] = None

    def __repr__(self):
        return f"<Job(id='{self.id}', name='{self.name}', status='{self.status}')>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "status": self.status.value,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class JobQueue:
    """Simple in-memory async job queue."""

    def __init__(self, max_concurrent: int = 2):
        self._jobs: dict[str, Job] = {}
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._max_concurrent = max_concurrent

    def enqueue(self, name: str, coro: Coroutine) -> str:
        """Add a job to the queue and return its ID."""
        job_id = uuid4().hex
        job = Job(job_id, name, coro)
        self._jobs[job_id] = job
        asyncio.create_task(self._run_job(job))
        logger.info("Enqueued job %s: %s", job_id, name)
        return job_id

    async def _run_job(self, job: Job) -> None:
        """Execute a job with semaphore-based concurrency control."""
        async with self._semaphore:
            job.status = JobStatus.RUNNING
            try:
                job.result = await job.coro
                job.status = JobStatus.COMPLETED
                logger.info("Job %s completed", job.id)
            except Exception as e:
                job.status = JobStatus.FAILED
                job.error = str(e)
                logger.error("Job %s failed: %s", job.id, e)
            finally:
                job.completed_at = datetime.now(timezone.utc)

    def get_job(self, job_id: str) -> Optional[Job]:
        """Get a job by ID."""
        return self._jobs.get(job_id)

    def get_jobs(self, limit: int = 50) -> list[Job]:
        """Get recent jobs."""
        sorted_jobs = sorted(
            self._jobs.values(), key=lambda j: j.created_at, reverse=True
        )
        return sorted_jobs[:limit]


job_queue = JobQueue()
