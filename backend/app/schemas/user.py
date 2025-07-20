from pydantic import BaseModel, EmailStr

# Schema for creating a user (will be taken from frontend)
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# Schema for returning user info (will be given from backend)
class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        orm_mode = True

