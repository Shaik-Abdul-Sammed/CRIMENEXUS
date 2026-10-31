"""
Scenario: Shared Station Terminal 12-Hour Shift Token & Hardware Device Binding.
Tests:
  1. Login with device_id=A -> receive a 12-hour token.
  2. Use token with device_id=A -> access granted.
  3. Use the SAME token with device_id=B -> HTTP 401 "Device mismatch".
  4. Wait 13 hours (mock time / expired token) -> HTTP 401 token expired.
  5. Verify only 1 active shift token per device_id (revokes old one on new login).
"""

from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.postgres import SessionLocal
from app.models.user import User
from app.security.authentication import (
    get_password_hash,
    create_shift_token,
    JWT_SECRET_KEY,
    JWT_ALGORITHM
)
from jose import jwt

client = TestClient(app)


@pytest.fixture(scope="module")
def shift_test_user():
    db = SessionLocal()
    username = "station_io_sharma"
    email = "io_sharma@police.gov.in"
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = User(
            username=username,
            email=email,
            hashed_password=get_password_hash("StationSecret2026!"),
            role="INVESTIGATOR",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    user_id = user.id
    db.close()
    return {"id": user_id, "username": username, "password": "StationSecret2026!"}


def test_scenario_shared_terminal_shift_full(shift_test_user):
    terminal_a = "DESKTOP-THANA-CENTRAL-01"
    terminal_b = "LAPTOP-PATROL-CAR-04"

    # Test 1: Login with device_id=A -> receive a 12-hour token
    login_res = client.post(
        "/api/v1/auth/shift-login",
        json={"username": shift_test_user["username"], "password": shift_test_user["password"]},
        headers={"X-Device-ID": terminal_a}
    )
    assert login_res.status_code == 200, f"Shift login failed: {login_res.text}"
    data = login_res.json()
    token_1 = data["access_token"]
    assert data["expires_in_seconds"] == 720 * 60
    assert data["token_type"] == "bearer"

    # Decode and check claims
    decoded = jwt.decode(token_1, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    assert decoded["device_id"] == terminal_a
    assert decoded["type"] == "shift"

    # Test 2: Use token with device_id=A -> access granted
    res_a = client.get(
        "/api/v1/auth/station-me",
        headers={"Authorization": f"Bearer {token_1}", "X-Device-ID": terminal_a}
    )
    assert res_a.status_code == 200, f"Access on terminal A failed: {res_a.text}"
    assert res_a.json()["username"] == shift_test_user["username"]

    # Test 3: Use the SAME token with device_id=B -> HTTP 401 "Device mismatch"
    res_b = client.get(
        "/api/v1/auth/station-me",
        headers={"Authorization": f"Bearer {token_1}", "X-Device-ID": terminal_b}
    )
    assert res_b.status_code == 401
    assert "Device mismatch" in res_b.json().get("detail", "")

    # Also test missing device_id header with shift token -> HTTP 401
    res_no_dev = client.get(
        "/api/v1/auth/station-me",
        headers={"Authorization": f"Bearer {token_1}"}
    )
    assert res_no_dev.status_code == 401

    # Test 4: Wait 13 hours (mock expired token) -> HTTP 401 token expired
    expired_token = create_shift_token(
        data={"sub": str(shift_test_user["id"]), "username": shift_test_user["username"], "role": "INVESTIGATOR"},
        device_id=terminal_a,
        expires_delta=timedelta(hours=-1)  # expired 1 hour ago (13h elapsed equivalent)
    )
    res_expired = client.get(
        "/api/v1/auth/station-me",
        headers={"Authorization": f"Bearer {expired_token}", "X-Device-ID": terminal_a}
    )
    assert res_expired.status_code == 401

    # Test 5: Verify only 1 active shift token per device_id (revokes old one on new login)
    login_res_2 = client.post(
        "/api/v1/auth/shift-login",
        json={"username": shift_test_user["username"], "password": shift_test_user["password"]},
        headers={"X-Device-ID": terminal_a}
    )
    assert login_res_2.status_code == 200
    token_2 = login_res_2.json()["access_token"]
    assert token_2 != token_1

    # Old token_1 must now be rejected as revoked on terminal_a
    res_old_token = client.get(
        "/api/v1/auth/station-me",
        headers={"Authorization": f"Bearer {token_1}", "X-Device-ID": terminal_a}
    )
    assert res_old_token.status_code == 401
    assert "revoked" in res_old_token.json().get("detail", "").lower()

    # New token_2 must succeed on terminal_a
    res_new_token = client.get(
        "/api/v1/auth/station-me",
        headers={"Authorization": f"Bearer {token_2}", "X-Device-ID": terminal_a}
    )
    assert res_new_token.status_code == 200
