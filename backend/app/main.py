import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
import contextlib # Import contextlib for lifespan management

from app.database import Base, get_db, get_engine, get_session_local

from app import models
from app.routes import user, product

# Define the lifespan context manager
@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for application startup and shutdown.
    Handles database table creation based on the environment.
    """
    # Startup events
    if os.getenv("APP_ENV") != "test":
        print("Creating database tables for application startup...")
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
        print("Tables created.")
    else:
        print("Skipping database table creation during test environment startup (handled by pytest fixtures).")

    yield 

    print("Application shutdown complete.")

# Pass the lifespan context manager to the FastAPI app
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# User routes
app.include_router(user.router)

# Product routes
app.include_router(product.router)

@app.get('/')
def root():
    return {'message': 'API Testing!'}

@app.get('/test-db')
def test_db(db: Session = Depends(get_db)):
    """
    Testing to see if the database connection works.
    """
    result = db.execute(text('SELECT 1')).fetchone()
    return {"db connection": (result is not None and result[0] == 1)}

if __name__ == "__main__":
    # When using `uvicorn`, the `lifespan` function handles database creation.
    if os.getenv("APP_ENV") != "test":
        print("Running main.py directly: Ensuring database tables exist...")
        engine = get_engine()
        Base.metadata.create_all(bind=engine)
        print("Tables created for direct run.")
    else:
        print("Running main.py directly in test environment. Table creation handled by pytest.")