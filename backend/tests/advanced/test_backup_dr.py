import pytest
import os
import shutil
from app.services.backup.backup_service import (
    trigger_backup,
    list_backups,
    verify_backup_integrity,
    prune_expired_backups,
    execute_dr_restoration_drill,
    get_backup_dir
)

@pytest.fixture(autouse=True)
def clean_backup_catalog():
    # Setup test backup directory
    test_backup_dir = "/tmp/crimenexus_test_backups"
    os.environ["CRIMENEXUS_BACKUP_DIR"] = test_backup_dir
    os.makedirs(test_backup_dir, exist_ok=True)
    yield
    # Cleanup
    if os.path.exists(test_backup_dir):
        shutil.rmtree(test_backup_dir)


def test_trigger_backup_creates_sha256_manifest():
    backup = trigger_backup(backup_type="FULL", created_by="TEST_RUNNER")
    assert backup["backup_id"].startswith("BCK-")
    assert backup["status"] == "COMPLETED"
    assert len(backup["sha256"]) == 64
    
    catalog = list_backups()
    assert any(b["backup_id"] == backup["backup_id"] for b in catalog)


def test_verify_backup_integrity():
    backup = trigger_backup(backup_type="INCREMENTAL", created_by="POLICE_CRON")
    res = verify_backup_integrity(backup["backup_id"])
    assert res["verified"] is True
    assert res["status"] == "INTEGRITY_VERIFIED"
    assert res["calculated_sha256"] == backup["sha256"]


def test_tampered_backup_fails_verification():
    backup = trigger_backup(backup_type="FULL", created_by="AUDITOR")
    bck_id = backup["backup_id"]
    
    # Intentionally corrupt the file on disk
    file_path = os.path.join(os.environ.get("CRIMENEXUS_BACKUP_DIR", "/tmp/crimenexus_test_backups"), f"{bck_id}.json")
    with open(file_path, "a") as f:
        f.write("TAMPERED_MALICIOUS_INJECTION")
        
    res = verify_backup_integrity(bck_id)
    assert res["verified"] is False
    assert res["status"] == "CORRUPTED"


def test_dr_restoration_drill():
    backup = trigger_backup(backup_type="FULL", created_by="DGP_OVERSIGHT")
    drill = execute_dr_restoration_drill(backup["backup_id"])
    assert drill["status"] == "RESTORE_VERIFIED"
    assert drill["records_restored"] > 0
    assert drill["rto_seconds"] < 60  # RTO under 1 minute


def test_prune_expired_backups_preserves_min_retained():
    # Create 5 backups
    for i in range(5):
        trigger_backup(backup_type="DAILY", created_by=f"CRON_{i}")
        
    prune_res = prune_expired_backups(retention_days=0, min_retained=3)
    assert prune_res["retained_count"] >= 3
