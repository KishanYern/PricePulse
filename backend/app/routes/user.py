from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models import User
from app.schemas.user import LoginResponse, UserCreate, UserOut, WholeUserOut, Token
from app.utils import hash_password, verify_password
from app.auth import create_access_token, get_current_user
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, FRONTEND_DOMAIN

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get details of the current authenticated user. This route is protected.
    """
    return current_user

@router.get('/{user_id}', response_model=WholeUserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a user by the given user ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="There is no user with this ID")
    return user

@router.get("/", response_model=list[WholeUserOut])
def get_all_users(db: Session = Depends(get_db)):
    """
    Retrieve all users.
    """
    users = db.query(User).all()
    return users

@router.post("/create", status_code=status.HTTP_201_CREATED, response_model=Token)
def create_user(
    response: Response, # Inject Response to set cookie
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new user and automatically log them in by returning a JWT.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create new user
    new_user = User(
        email=user.email,
        password=hash_password(user.password) # Hash the password before saving
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user) # Refresh to get the new_user.id

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, # Use the ID of the newly created user
        expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        expires=(datetime.now(timezone.utc) + access_token_expires),
        path="/",
        domain=FRONTEND_DOMAIN
    )

    return Token(access_token=access_token, token_type="bearer") # Return the token

@router.put('/{user_id}', response_model=WholeUserOut)
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

@router.post('/login', response_model=LoginResponse) # Use Token schema for response
def login_user(
    response: Response,
    user_credentials: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Log in a user and return a JWT access token, setting it as an HTTP-only cookie.
    """
    db_user = db.query(User).filter(User.email == user_credentials.email).first()

    # Check if user exists OR if password doesn't match
    if not db_user or not verify_password(user_credentials.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, # Use 400 for invalid credentials
            detail="Invalid credentials"
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(db_user.id)}, # 'sub' claim will store the user's ID
        expires_delta=access_token_expires
    )

    # Set the token in an HTTP-only, secure cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=int(access_token_expires.total_seconds()),
        path="/",
        domain=FRONTEND_DOMAIN
    )

    # Update last login time
    db_user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_user)

    # Return a basic token response (cookie is the primary delivery)
    return {"token": {"access_token": access_token, "token_type": "bearer"}, "user": db_user}

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    """
    Logs out the current user by deleting the access token cookie.
    """
    # current_user is passed just to ensure the user is authenticated before logging out
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="lax",
        path="/"
    )
    return {"message": "Logged out successfully"}

@router.put("/admin/{email}", response_model=WholeUserOut)
def update_user_role(
    email: str,
    is_admin: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the admin status of a user.
    """
    if not current_user.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.admin = is_admin
    db.commit()
    db.refresh(user)
    return user
