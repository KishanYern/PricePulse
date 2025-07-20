import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

# Importing all the models
from app.models import Product, Alert, PriceHistory, UserProduct, User

# We will use an in-memory SQLite database for testing to avoid overuse in dev environment
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    """
    Create an SQL Test environment
    """
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

    # This event listener ensures PRAGMA foreign_keys = ON is executed for every new connection.
    # We need this listener to verify that the CASCADE DELETE property is working for foreign keys
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return engine

@pytest.fixture(scope="session")
def tables(engine):
    """
    Create and drop all tables in the test database
    """
    print("\nCreating database tables.")
    Base.metadata.create_all(engine)
    yield
    print("Dropping database tables.")
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
        db.close()
        # Only rollback if the transaction is still active. 
        # When an Integrity test fails, SQLAlchemy will automatically rollback the transaction so we dont have to do it manually.
        if transaction.is_active:
            transaction.rollback()
        connection.close()

@pytest.fixture(scope="function")
def test_client(test_db):
    """
    Create a test client with dependency override to use the test database.
    This fixture can be reused across all API test files.
    """
    def override_get_db():
        try:
            yield test_db
        finally:
            pass  # test_db fixture handles cleanup
    
    # Override the dependency
    app.dependency_overrides[get_db] = override_get_db
    
    # Create test client
    client = TestClient(app)
    
    yield client
    
    # Clean up
    app.dependency_overrides.clear()
