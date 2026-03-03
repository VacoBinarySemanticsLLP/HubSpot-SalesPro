from sqlalchemy import create_engine, Column, Integer, String, BigInteger, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./hubspot_learning.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TicketRecord(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(BigInteger, unique=True)
    subject = Column(String)
    
    # Restaurant Domain Properties
    merchant_id = Column(String)
    restaurant_tier = Column(String)
    investigation_reason = Column(String)
    sales_investigation_required = Column(String)
    
    # Owner Info
    owner_name = Column(String)
    owner_email = Column(String)
    
    # Merchant / Company Info
    company_name = Column(String)
    company_city = Column(String)
    
    # Customer / Contact Info
    contact_name = Column(String)
    contact_phone = Column(String)
    
    sla_deadline = Column(String)
    
    raw_payload = Column(JSON) 

Base.metadata.create_all(bind=engine)