import uuid
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config.settings import (
    JWT_SECRET_KEY,
    JWT_REFRESH_SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SHIFT_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from app.database.postgres import get_db
from app.models.user import User
from app.services.streaming.redis_streams import get_redis_client

# In-memory registry fallback for active device shift tokens
_ACTIVE_DEVICE_SHIFT_TOKENS: Dict[str, str] = {}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against an encrypted hash using native bcrypt."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generates a bcrypt hash for a plaintext password."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a hardened, signed JSON Web Token (JWT) with strict 15-minute default expiration."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a cryptographically signed refresh token (7 days default) with independent refresh key."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "refresh"})
    return jwt.encode(to_encode, JWT_REFRESH_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a refresh token using the refresh secret."""
    try:
        payload = jwt.decode(token, JWT_REFRESH_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type, expected refresh")
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Expired or invalid refresh token")


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JSON Web Token (JWT)."""
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    FastAPI dependency: decodes JWT, verifies signature, and retrieves the authenticated User.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user


def create_shift_token(data: Dict[str, Any], device_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a 12-hour Station Desktop Shift Token cryptographically bound to a terminal device_id.
    Revokes any previous active shift session on the same device.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=SHIFT_TOKEN_EXPIRE_MINUTES))
    jti = str(uuid.uuid4())
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "shift",
        "device_id": device_id,
        "jti": jti
    })
    # Register active jti for device_id
    _ACTIVE_DEVICE_SHIFT_TOKENS[device_id] = jti
    r = get_redis_client()
    if r:
        try:
            r.set(f"shift_token:{device_id}", jti, ex=SHIFT_TOKEN_EXPIRE_MINUTES * 60)
        except Exception:
            pass
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user_station_bound(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Strict FastAPI dependency for shared police station terminals.
    Validates JWT signature, enforces device_id terminal matching, and checks revocation.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    token_device_id = payload.get("device_id")
    token_type = payload.get("type")

    # If this is a station shift token, enforce hardware device_id binding
    if token_device_id or token_type == "shift":
        req_device_id = (
            request.headers.get("x-device-id") or
            request.headers.get("X-Device-ID") or
            request.headers.get("device-id") or
            request.headers.get("device_id")
        )
        if not req_device_id or req_device_id != token_device_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Device mismatch: Token bound to another station terminal",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check single-active-token enforcement per terminal
        jti = payload.get("jti")
        active_jti = None
        r = get_redis_client()
        if r:
            try:
                cached = r.get(f"shift_token:{token_device_id}")
                if cached:
                    active_jti = cached.decode("utf-8") if isinstance(cached, bytes) else str(cached)
            except Exception:
                pass
        if not active_jti:
            active_jti = _ACTIVE_DEVICE_SHIFT_TOKENS.get(token_device_id)

        if active_jti and jti and active_jti != jti:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Shift token has been revoked by a newer login on this terminal",
                headers={"WWW-Authenticate": "Bearer"},
            )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user
