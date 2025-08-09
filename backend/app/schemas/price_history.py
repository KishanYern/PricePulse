from pydantic import BaseModel, ConfigDict, Field
from enum import Enum
from datetime import datetime

class NotificationFilter(Enum):
    all = "all"
    enabled = "enabled"
    disabled = "disabled"

class PriceHistoryOut(BaseModel):
    id: int
    product_id: int
    price: float
    timestamp: datetime
    source: str | None = None

    model_config = ConfigDict(from_attributes=True)

class ReturnSearchHistoryModel(BaseModel):
    id: int
    name: str | None = Field(..., alias="productName")
    product_id: int = Field(..., alias="productId")
    price: float
    timestamp: datetime
    source: str | None = None
    notifications: bool | None = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
