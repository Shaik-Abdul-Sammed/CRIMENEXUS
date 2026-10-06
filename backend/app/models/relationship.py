from sqlalchemy import Column, Integer, String, Float

from app.database.postgres import Base


class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(Integer, primary_key=True, index=True)

    source_person_id = Column(Integer, nullable=False)
    target_person_id = Column(Integer, nullable=False)

    relationship_type = Column(String(100), nullable=False)

    strength = Column(Float, default=1.0)

    confidence = Column(Float, default=0.0)
