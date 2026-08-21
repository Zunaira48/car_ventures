from pydantic import BaseModel, ConfigDict
from datetime import datetime

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    message: str
    link: str | None
    is_read: bool
    created_at: datetime

class UnreadCountOut(BaseModel):
    unread_count: int