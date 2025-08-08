from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Clear metadata cache
metadata = MetaData()
metadata.clear()

# Base for declarative models
Base = declarative_base()

# Global variables to hold the engine and sessionmaker
# Initially set to None, they will be initialized on first use or by tests
_engine = None
_SessionLocal = None

def get_engine():
    global _engine
    if _engine is None:
        # Load environment variables if not already loaded (e.g., in production)
        load_dotenv() 
        # Use DATABASE_URL from environment for production/development
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is not set.")
        _engine = create_engine(database_url, pool_pre_ping=True)
    return _engine

def get_session_local():
    global _SessionLocal
    if _SessionLocal is None:
        engine = get_engine()
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return _SessionLocal

# Dependency used in FastAPI routes
def get_db():
    SessionLocal = get_session_local()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Functions for Testing ---
# These functions allow tests to inject a specific engine/sessionmaker
def set_test_database(test_engine):
    global _engine, _SessionLocal
    _engine = test_engine
    _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def reset_database_globals():
    """Resets the global engine and sessionmaker. Useful for tearing down tests."""
    global _engine, _SessionLocal
    _engine = None
    _SessionLocal = None