from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

class MessageCreate(BaseModel):
    conversation_id: Optional[int] = None
    sender_id: str
    sender_type: Literal["student", "faculty"]
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: str
    sender_type: Literal["student", "faculty"]
    receiver_id: str
    content: str
    is_read: bool = False
    edited_at: Optional[datetime] = None
    deleted: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MessageReadPatch(BaseModel):
    is_read: bool = True
