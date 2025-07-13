from fastapi import FastAPI
from app.database import Base, engine, SessionLocal
from sqlalchemy import text
from sqlalchemy.orm import Session

# Import all the models
from app import models

Base.metadata.create_all(bind=engine)

app = FastAPI()

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
    return {"db connection": result[0] == 1}