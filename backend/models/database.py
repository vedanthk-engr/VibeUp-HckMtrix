import os
import uuid
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "vibeup.db")
    DATABASE_URL = f"sqlite:///{DB_PATH}"

if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBProfile(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True, index=True)  # maps to auth.users uuid
    risk_archetype = Column(String, nullable=True)
    vibe_selections = Column(String, nullable=True)  # JSON stringified list of vibes
    cash_balance = Column(Float, default=1000000.0)  # Default ₹10,00,000 virtual cash
    created_at = Column(DateTime, default=datetime.utcnow)

class DBHolding(Base):
    __tablename__ = "holdings"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    ticker = Column(String, index=True)
    exchange = Column(String, default="NSE")
    quantity = Column(Float)
    avg_buy_price = Column(Float)
    buy_date = Column(String)
    is_paper = Column(Boolean, default=False)

class DBChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    role = Column(String)  # user / assistant
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBDebateVote(Base):
    __tablename__ = "debate_votes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ticker = Column(String, index=True)
    vote = Column(String)  # bull / bear
    user_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBJournalEntry(Base):
    __tablename__ = "journal_entries"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    ticker = Column(String)
    thesis = Column(Text)
    side = Column(String)  # bull / bear
    created_at = Column(DateTime, default=datetime.utcnow)

class DBRAGDocument(Base):
    __tablename__ = "rag_documents"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content = Column(Text)
    embedding_json = Column(Text, nullable=True)  # Store JSON representation for SQLite fallback
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBUserCardCollection(Base):
    __tablename__ = "user_card_collection"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    ticker = Column(String, index=True)
    is_staked = Column(Boolean, default=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

class DBXPEvent(Base):
    __tablename__ = "xp_events"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    event_type = Column(String)
    xp_amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBWhaleAlert(Base):
    __tablename__ = "whale_alerts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    ticker = Column(String, index=True)
    threshold = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBNotification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    type = Column(String)  # card_unlocked, xp_milestone, whale_alert, earnings_live, stress_test_complete
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DBTransaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    ticker = Column(String, index=True)
    side = Column(String)  # BUY / SELL
    quantity = Column(Float)
    price = Column(Float)
    stt = Column(Float, default=0.0)
    gst = Column(Float, default=0.0)
    stamp_duty = Column(Float, default=0.0)
    exchange_fees = Column(Float, default=0.0)
    brokerage = Column(Float, default=0.0)
    total_value = Column(Float)  # Total amount debited/credited
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentMemory(Base):
    __tablename__ = "agent_memory"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    memory_type = Column(String) # portfolio_summary, archetype, behavioral_flag, recent_action, signal_history
    content = Column(Text)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

DBAgentMemory = AgentMemory

# Helper to initialize DB tables
def init_db():
    import sqlalchemy
    Base.metadata.create_all(bind=engine)
    
    # Check if cash_balance column exists in profiles
    inspector = sqlalchemy.inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('profiles')]
    if 'cash_balance' not in columns:
        try:
            with engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE profiles ADD COLUMN cash_balance FLOAT DEFAULT 1000000.0"))
        except Exception as e:
            pass

    card_cols = [c['name'] for c in inspector.get_columns('user_card_collection')]
    if 'is_staked' not in card_cols:
        try:
            with engine.begin() as conn:
                conn.execute(sqlalchemy.text("ALTER TABLE user_card_collection ADD COLUMN is_staked BOOLEAN DEFAULT 0"))
        except Exception as e:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
