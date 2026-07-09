"""Character model for story characters."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey

from app.database import Base


class Character(Base):
    """Character model representing a character in a story."""

    __tablename__ = "characters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    appearance = Column(Text, nullable=True)
    consistency_prompt = Column(Text, nullable=True)
    created_at = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self):
        return f"<Character(id={self.id}, name='{self.name}', story_id={self.story_id})>"
