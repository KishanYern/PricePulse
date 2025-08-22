import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
import contextlib # Import contextlib for lifespan management
from app.config import ALLOWED_CORS_ORIGINS
from datetime import datetime, timezone, timedelta

# CRON Jobs
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.scheduler.products import update_product_prices_job

from app.database import Base, get_db, get_engine, get_session_local

from app import models
from app.routes import user, product, price_history, notification

# Define the background scheduler
scheduler = AsyncIOScheduler()

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

    # # # Scheduled tasks only on testing. Actual task is hosted on railway.
    # # Start the background scheduler
    # print("Starting background scheduler...")
    # scheduler.add_job(update_product_prices_job, "cron", hour='*/6', id="update_product_prices_job")
    # scheduler.start()
    
    yield

    # Shutdown Events
    print("Shutting down background scheduler...")
    scheduler.shutdown()
    print("Application shutdown complete.")

# Pass the lifespan context manager to the FastAPI app
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,  # Allows origins specified in the config
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# User routes
app.include_router(user.router)

# Product routes
app.include_router(product.router)

# Price History routes
app.include_router(price_history.router)

# Notification routes
app.include_router(notification.router)

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