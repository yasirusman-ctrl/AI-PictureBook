"""Page model for story pages."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey

from app.database import Base


class Page(Base):
    """Page model representing a single page in a story."""

    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    narration = Column(Text, nullable=True)
    image_prompt = Column(Text, nullable=True)
    image_path = Column(String(512), nullable=True)
    status = Column(
        String(50),
        nullable=False,
        default="pending",
        comment="pending, generating, complete, failed",
    )
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self):
        return f"<Page(id={self.id}, story_id={self.story_id}, page={self.page_number}, status='{self.status}')>"
