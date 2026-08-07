from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from backend.database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String(100), nullable=False, index=True)
    faculty_id = Column(String(100), nullable=False, index=True)
    last_message = Column(Text, nullable=True, default="")
    last_message_time = Column(DateTime, nullable=True, default=lambda: datetime.now(timezone.utc))
    unread_student_count = Column(Integer, default=0, nullable=False)
    unread_faculty_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("student_id", "faculty_id", name="uq_student_faculty"),
        Index("idx_conversations_student_faculty", "student_id", "faculty_id"),
    )
