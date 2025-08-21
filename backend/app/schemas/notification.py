from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

class NotificationCreate(BaseModel):
    from_user_id: int
    user_id: int
    message: str

    model_config = ConfigDict(
        from_attributes=True
    )

class NotificationResponse(BaseModel):
    id: int
    from_user_id: int
    user_id: int
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )