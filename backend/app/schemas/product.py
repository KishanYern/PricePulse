from pydantic import BaseModel, HttpUrl, ConfigDict
from datetime import datetime

# Schema for creating a product (will be taken from frontend)
class ProductCreate(BaseModel):
    url: HttpUrl


# Schema for returning product info (will be given from backend)
class ProductOut(BaseModel):
    id: int
    url: HttpUrl
    name: str
    current_price: float
    lowest_price: float | None = None
    highest_price: float | None = None
    created_at: datetime
    last_checked: datetime

    model_config = ConfigDict(from_attributes=True)