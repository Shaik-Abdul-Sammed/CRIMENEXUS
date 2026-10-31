import time
from typing import Dict, Any, Optional

# In-memory and Redis-backed DVR job registry
_DVR_JOBS: Dict[str, Dict[str, Any]] = {}


def register_dvr_job(job_id: str, filename: str, file_size: int) -> Dict[str, Any]:
    job = {
        "job_id": job_id,
        "filename": filename,
        "file_size": file_size,
        "status": "QUEUED",
        "progress": 0.0,
        "frames_processed": 0,
        "detections_count": 0,
        "detections": [],
        "created_at": time.time(),
        "updated_at": time.time()
    }
    _DVR_JOBS[job_id] = job
    return job


def update_dvr_job(job_id: str, **kwargs) -> Optional[Dict[str, Any]]:
    job = _DVR_JOBS.get(job_id)
    if not job:
        job = {"job_id": job_id}
        _DVR_JOBS[job_id] = job
    job.update(kwargs)
    job["updated_at"] = time.time()
    return job


def get_dvr_job(job_id: str) -> Optional[Dict[str, Any]]:
    return _DVR_JOBS.get(job_id)
