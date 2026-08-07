from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class ConversationBase(BaseModel):
    student_id: str
    faculty_id: str
    last_message: Optional[str] = ""

class ConversationCreate(ConversationBase):
    pass

class ConversationResponse(ConversationBase):
    id: int
    last_message_time: Optional[datetime] = None
    unread_student_count: int = 0
    unread_faculty_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConversationWithDetails(ConversationResponse):
    other_participant_name: Optional[str] = None
    other_participant_email: Optional[str] = None
    other_participant_role: Optional[str] = None
    unread_count: int = 0
