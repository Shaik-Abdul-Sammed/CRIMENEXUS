from sqlalchemy import Column, Integer, String

from app.database.postgres import Base


class Person(Base):
    __tablename__ = "persons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    age = Column(Integer)
    gender = Column(String(50))
    occupation = Column(String(150))
    location = Column(String(200))
