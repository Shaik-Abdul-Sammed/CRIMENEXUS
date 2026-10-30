from enum import Enum


class Role(str, Enum):
    INVESTIGATOR = "INVESTIGATOR"
    ANALYST = "ANALYST"
    SUPERVISOR = "SUPERVISOR"
    ADMIN = "ADMIN"


class Permission(str, Enum):
    VIEW_CASES = "cases:view"
    CREATE_CASES = "cases:create"
    EDIT_CASES = "cases:edit"
    INGEST_DATA = "data:ingest"
    VIEW_NETWORK = "network:view"
    EDIT_NETWORK = "network:edit"
    VIEW_AI_INSIGHTS = "ai:view"
    EXPORT_REPORTS = "reports:export"
    MANAGE_USERS = "users:manage"


ROLE_PERMISSIONS = {
    Role.INVESTIGATOR: [
        Permission.VIEW_CASES,
        Permission.CREATE_CASES,
        Permission.INGEST_DATA,
        Permission.VIEW_NETWORK,
        Permission.VIEW_AI_INSIGHTS,
    ],
    Role.ANALYST: [
        Permission.VIEW_CASES,
        Permission.VIEW_NETWORK,
        Permission.EDIT_NETWORK,
        Permission.VIEW_AI_INSIGHTS,
        Permission.EXPORT_REPORTS,
    ],
    Role.SUPERVISOR: [
        Permission.VIEW_CASES,
        Permission.CREATE_CASES,
        Permission.EDIT_CASES,
        Permission.INGEST_DATA,
        Permission.VIEW_NETWORK,
        Permission.VIEW_AI_INSIGHTS,
        Permission.EXPORT_REPORTS,
    ],
    Role.ADMIN: list(Permission),
}
