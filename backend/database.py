from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./investigations.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Investigation(Base):
    __tablename__ = "investigations"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True)
    merchant_name = Column(String)  # <-- ADD THIS LINE
    reason = Column(String)
    investigation_reason = Column(String, nullable=True)
    status = Column(String, default="Open")
    comments = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class HubSpotToken(Base):
    __tablename__ = "tokens"
    id = Column(Integer, primary_key=True)
    access_token = Column(String)
    refresh_token = Column(String)

Base.metadata.create_all(bind=engine)