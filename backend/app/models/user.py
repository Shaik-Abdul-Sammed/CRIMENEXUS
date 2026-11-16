from sqlalchemy import Column, Integer, String, Boolean
from app.database.postgres import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=True, default="")
    badge_number = Column(String(100), nullable=True, default="")
    jurisdiction_code = Column(String(100), nullable=True, default="")
    hashed_password = Column(String(255), nullable=True, default="")
    role = Column(String(50), default="investigator")
    is_active = Column(Boolean, default=True)

    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            if k == "id" and isinstance(v, str):
                # Allow string IDs in mock tests without crash
                try:
                    self.id = int(v)
                except ValueError:
                    self.id = abs(hash(v)) % (10 ** 8)
            else:
                setattr(self, k, v)
