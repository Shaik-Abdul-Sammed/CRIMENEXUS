from typing import List, Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

from app.config.settings import JWT_SECRET_KEY, JWT_ALGORITHM
from app.models.user import User
from app.database.postgres import get_db
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_token_claims(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Extracts and cryptographically validates JWT claims directly from the Authorization Bearer token.
    Zero-trust mandate: never trusts client body/header parameters for authorization decisions.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if not payload.get("sub") or not payload.get("role"):
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


class RoleChecker:
    """
    Server-side Role-Based Access Control (RBAC).
    Strictly verifies the cryptographic role claim embedded inside the verified JWT token.
    """

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = [r.upper() for r in allowed_roles]

    def __call__(
        self,
        claims: Dict[str, Any] = Depends(get_token_claims),
        db: Session = Depends(get_db)
    ) -> User:
        # 1. Check claim directly from cryptographic payload
        token_role = (claims.get("role") or "").upper()
        user_id = claims.get("sub")

        # 2. Match role against allowed list
        is_authorized = token_role in self.allowed_roles or "ADMIN" in token_role or "STATE_ADMIN" in token_role
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Officer role '{token_role}' lacks required permissions: {self.allowed_roles}"
            )

        # 3. Retrieve and verify that the user exists and remains active in the database
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or revoked."
            )

        return user
