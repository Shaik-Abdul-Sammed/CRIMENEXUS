from typing import List
from fastapi import Depends, HTTPException, status
from app.models.user import User
from app.security.authentication import get_current_user


class RoleChecker:
    """Dependency that restricts route access to specified roles."""

    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = [r.upper() for r in allowed_roles]

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "").upper()
        if user_role not in self.allowed_roles and "ADMIN" not in user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Requires one of roles: {self.allowed_roles}"
            )
        return current_user
