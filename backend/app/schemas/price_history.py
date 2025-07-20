from pydantic import BaseModel, ConfigDict
from datetime import datetime

class PriceHistoryOut(BaseModel):
    id: int
    product_id: int
    price: float
    timestamp: datetime
    source: str | None = None

    model_config = ConfigDict(from_attributes=True)
