import os
import sys
from starlette.requests import Request

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database.postgres import SessionLocal
from app.models.user import User
from app.security.authentication import get_password_hash, verify_password, create_access_token, decode_access_token
from app.api.auth import login, refresh_access_token
from app.schemas.user import UserLogin, TokenRefreshRequest

def verify_jwt_auth():
    print("=" * 60)
    print("VERIFYING JWT AUTHENTICATION ENDPOINT & HARDENING")
    print("=" * 60)

    db = SessionLocal()
    try:
        test_email = "officer.sharma@police.gov.in"
        test_pass = "PoliceSecure#2026"

        user = db.query(User).filter(User.email == test_email).first()
        if not user:
            user = User(
                username="io_sharma",
                email=test_email,
                hashed_password=get_password_hash(test_pass),
                role="INSPECTOR_IO",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(" -> Seeded test police officer account.")
        else:
            print(" -> Test officer account already present.")

        # Construct dummy Starlette request for SlowAPI
        scope = {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/auth/login",
            "headers": [],
            "client": ("127.0.0.1", 12345)
        }
        dummy_req = Request(scope)

        # Test login function
        req = UserLogin(email=test_email, password=test_pass)
        token_res = login(request=dummy_req, login_data=req, db=db)

        print(f" -> Token Type: {token_res.token_type}")
        print(f" -> Access Token (15m): {token_res.access_token[:30]}...")
        print(f" -> Refresh Token (7d): {token_res.refresh_token[:30]}...")
        print(f" -> Authenticated User: {token_res.username} ({token_res.role})")

        # Verify decoded payload
        decoded = decode_access_token(token_res.access_token)
        print(f" -> Decoded Token Subject: {decoded.get('sub')}")
        print(f" -> Decoded Username: {decoded.get('username')}")
        print(f" -> Decoded Role: {decoded.get('role')}")
        print(f" -> Decoded Type: {decoded.get('type')}")

        assert token_res.access_token is not None
        assert token_res.refresh_token is not None
        assert decoded.get("username") == "io_sharma"
        assert decoded.get("role") == "INSPECTOR_IO"
        assert decoded.get("type") == "access"

        # Test token refresh
        ref_scope = {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/auth/refresh",
            "headers": [],
            "client": ("127.0.0.1", 12345)
        }
        ref_req = Request(ref_scope)
        ref_res = refresh_access_token(request=ref_req, payload=TokenRefreshRequest(refresh_token=token_res.refresh_token), db=db)
        print(f" -> Successfully refreshed token! New access: {ref_res.access_token[:30]}...")
        assert ref_res.access_token is not None

        print(" [PASS] JWT Login & Refresh Token Hardening verified successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    verify_jwt_auth()
