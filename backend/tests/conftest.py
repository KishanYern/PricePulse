# conftest.py
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import os

# Import necessary functions from app.database
from app.database import Base, get_db, set_test_database, reset_database_globals 
from app.main import app

os.environ["APP_ENV"] = "test" # Set the environment to test

# We will use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    """
    Create an in-memory SQLite engine for the test session.
    """
    test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

    # This event listener ensures PRAGMA foreign_keys = ON is executed for every new connection.
    @event.listens_for(test_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Crucial step: Set the application's global database engine to the test engine
    set_test_database(test_engine)

    # Create all tables on the test engine once for the session
    print("\nCreating database tables.")
    Base.metadata.create_all(test_engine)
    
    yield test_engine

    # Drop all tables after the test session is complete
    print("Dropping database tables.")
    Base.metadata.drop_all(test_engine)
    
    # Reset the global engine and sessionmaker in app.database
    reset_database_globals()


@pytest.fixture(scope="function")
def test_db(engine): # This fixture depends on 'engine' which sets up the global test database
    """
    Provides a database session for each test instance. This will isolate test tasks and prevent contamination.
    """
    # The SessionLocal from app.database is now bound to the 'engine' provided by the 'engine' fixture
    # So, we can directly use app.database.get_session_local()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    connection = engine.connect()
    transaction = connection.begin()
    db = SessionLocal(bind=connection) # Bind the session to the specific connection for transaction control

    try:
        yield db
    finally:
        db.close()
        # Only rollback if the transaction is still active. 
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
            yield test_db # Yield the session from the test_db fixture
        finally:
            pass # The test_db fixture handles session cleanup
    
    # Override the dependency for the duration of this test function
    app.dependency_overrides[get_db] = override_get_db
    
    # Create test client
    client = TestClient(app)
    
    yield client
    
    # Clean up: clear dependency overrides after the test
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def authenticated_client(test_client):
    """
    Provides an authenticated TestClient.
    Creates a user and logs them in.
    The client will have the JWT token set in the headers.
    """
    import uuid
    email = f"testuser_{uuid.uuid4()}@example.com"
    password = "testpassword"

    # Create user
    user_data = {"email": email, "password": password}
    response = test_client.post("/users/create", json=user_data)
    assert response.status_code == 201

    token_data = response.json()
    token = token_data["access_token"]

    # Set auth header
    test_client.headers["Authorization"] = f"Bearer {token}"

    yield test_client

    # Clean up - remove auth header
    test_client.headers.pop("Authorization", None)