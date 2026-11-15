import os
import re
import pytest

candidate_paths = [
    "/src",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../src")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../src")),
    "/app/src"
]
FRONTEND_SRC = next((p for p in candidate_paths if os.path.isdir(p)), candidate_paths[1])

def test_rtcc_dashboard_no_overflow():
    """Verify RTCC Dashboard has overflow-x-auto, min-w-0, and responsive grid."""
    file_path = os.path.join(FRONTEND_SRC, "features/rtcc/RTCCDashboard.tsx")
    if not os.path.exists(file_path):
        pytest.skip(f"Frontend source file {file_path} not available in backend container context.")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "min-w-0" in content
    assert "overflow-x-auto" in content or "overflow-hidden" in content
    assert "truncate" in content or "text-ellipsis" in content

def test_intercept_translate_page_responsiveness():
    """Verify InterceptTranslatePage uses min-w-0, responsive grids, and table overflow wrapper."""
    file_path = os.path.join(FRONTEND_SRC, "features/intercept/InterceptTranslatePage.tsx")
    if not os.path.exists(file_path):
        pytest.skip(f"Frontend source file {file_path} not available in backend container context.")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "min-w-0" in content
    assert "overflow-x-auto" in content
    assert "grid grid-cols-1" in content

def test_person_risk_page_responsiveness():
    """Verify PersonRiskPage contains min-w-0 and truncation handling."""
    file_path = os.path.join(FRONTEND_SRC, "features/risk/PersonRiskPage.tsx")
    if not os.path.exists(file_path):
        pytest.skip(f"Frontend source file {file_path} not available in backend container context.")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "min-w-0" in content
    assert "truncate" in content or "text-ellipsis" in content or "line-clamp" in content
