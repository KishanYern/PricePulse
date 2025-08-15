from pydantic import BaseModel, HttpUrl, ConfigDict, Field
from datetime import datetime

# Schema for creating a product (will be taken from frontend)
class ProductCreate(BaseModel):
    url: HttpUrl
    source: str | None = None
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class UserCreateProduct(BaseModel):
    product: ProductCreate
    notes: str | None = Field(None, alias="notes")
    notify: bool = True
    lower_threshold: float | None = Field(None, alias="lowerThreshold")
    upper_threshold: float | None = Field(None, alias="upperThreshold")
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Schema for returning product info (will be given from backend)
class ProductOut(BaseModel):
    id: int
    url: str
    name: str = Field(..., alias="name")
    current_price: float = Field(..., alias="currentPrice")
    lowest_price: float | None = Field(None, alias="lowestPrice")
    highest_price: float | None = Field(None, alias="highestPrice")
    notes: str | None = Field(None, alias="notes")
    lower_threshold: float | None = Field(None, alias="lowerThreshold")
    upper_threshold: float | None = Field(None, alias="upperThreshold")
    notify: bool = Field(True, alias="notify")
    source: str | None = Field(None, alias="source")
    created_at: datetime = Field(..., alias="createdAt")
    last_checked: datetime = Field(..., alias="lastChecked")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)