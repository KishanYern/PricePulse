from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

# Schema for creating a user (will be taken from frontend)
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# Schema for returning user info (will be given from backend)
class UserOut(BaseModel):
    id: int
    email: EmailStr
    admin: bool

    model_config = ConfigDict(from_attributes=True)

class WholeUserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    last_login: datetime | None
    admin: bool

# This is the token schema used for authentication
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

class LoginResponse(BaseModel):
    token: Token
    user: UserOut

