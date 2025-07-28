from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models import User
from app.database import get_db
from app.schemas.user import TokenData

# Keep this for its 'tokenUrl' to be displayed in OpenAPI/Swagger UI
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token with an expiration time.
    :param data: Dictionary containing user data to encode in the token.
    :param expires_delta: Optional timedelta for custom expiration time.
    :return: Encoded JWT token as a string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """
    Decode a JWT access token and return the payload.
    :param token: JWT token string to decode.
    :return: Decoded payload as a dictionary.
    :raises HTTPException: If the token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from the JWT.
    Prioritizes HTTP-only cookie, then Authorization header.
    Raises HTTPException if the token is invalid or the user is not found.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token: Optional[str] = None

    # Try to get token from HTTP-only cookie
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        token = cookie_token
    else:
        # If not in cookie, try Authorization header (Bearer token)
        # This will be useful for external clients or if you decide to send it this way
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise credentials_exception # No token found anywhere

    try:
        payload = decode_access_token(token)
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        try:
            user_id_int = int(user_id)
        except ValueError:
            raise credentials_exception
        token_data = TokenData(id=user_id_int)
    except JWTError:
        raise credentials_exception # JWT is invalid/expired

    user = db.query(User).filter(User.id == token_data.id).first()
    if user is None:
        raise credentials_exception # User not found in DB

    return user