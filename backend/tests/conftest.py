import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.database import Base

# Importing all the models
from app.models import Product, Alert, PriceHistory, UserProduct, User

# We will use an in-memory SQLite database for testing to avoid overuse in dev environment
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    """
    Creating a test database
    """
    return create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

@pytest.fixture(scope="session")
def tables(engine):
    """
    Create and drop all tables in the test database
    """
    print("\nCreating database tables...")
    # Base.metadata.create_all will discover all models inheriting from Base
    # that have been imported or defined in the current scope (via app.models import).
    Base.metadata.create_all(engine)
    yield
    print("Dropping database tables...")
    Base.metadata.drop_all(engine)

@pytest.fixture(scope="function")
def test_db(engine, tables):
    """
    Provides a database session for each test instance. This will isolate test tasks and prevent contamination.
    """
    connection = engine.connect()
    transaction = connection.begin()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    db = SessionLocal()

    try:
        yield db
    finally:
        transaction.rollback() # Rollback the transaction to clean up after each test
        connection.close()
        db.close()
