from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

# Schema for creating a user (will be taken from frontend)
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# Schema for returning user info (will be given from backend)
class UserOut(BaseModel):
    id: int
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

# This is the token schema used for authentication
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None

