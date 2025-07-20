from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.schemas.user import UserCreate, UserOut
from app.utils import hash_password

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[UserOut])
def get_all_users(db: Session = Depends(get_db)):
    """
    Retrieve all users.
    """
    users = db.query(User).all()
    return users

@router.get('/{user_id}', response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a user by the given user ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="There is no user with this ID")
    return user

@router.post("/create", response_model=UserOut)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put('/{user_id}', response_model=UserOut)
def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    """
    Update an existing user.
    """
    existing_user = db.query(User).filter(User.id == user_id).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user details
    existing_user.email = user.email
    existing_user.password = hash_password(user.password)
    
    db.commit()
    db.refresh(existing_user)
    return existing_user

@router.delete('/{user_id}', response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """
    Delete a user by the given user ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="There is no user with this ID")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.post('/login', response_model=UserOut)
def login_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Log in a user.
    """
    db_user = db.query(User).filter(User.email == user.email).first()

    # Check if user exists
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check password
    if not db_user.verify_password(user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # Update last login time
    from datetime import datetime, timezone
    db_user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_user)
    return db_user
