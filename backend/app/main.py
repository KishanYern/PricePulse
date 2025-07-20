from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.routes import user, product

# Import all the models
from app import models

app = FastAPI()

# User routes
app.include_router(user.router)

# Product routes
app.include_router(product.router)

@app.get('/')
def root():
    return {'message': 'API Testing!'}

@app.get('/test-db')
def test_db():
    """
    Testing to see if the database connection works
    """
    db: Session = SessionLocal()
    result = db.execute(text('SELECT 1')).fetchone()
    return {"db connection": (result is not None and result[0] == 1)}

if __name__ == "__main__":
    # Create the database tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

