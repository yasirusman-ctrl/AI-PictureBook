"""Story model."""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON

from app.database import Base


class Story(Base):
    """Story model representing a generated storybook."""

    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, default="Untitled Story")
    description = Column(Text, nullable=True)
    status = Column(
        String(50),
        nullable=False,
        default="draft",
        comment="draft, generating_outline, generating_images, generating_pdf, complete, failed",
    )
    style = Column(String(100), default="Pixar")
    tone = Column(String(100), default="whimsical")
    num_pages = Column(Integer, default=16)
    characters_json = Column(Text, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    metadata_json = Column(JSON, nullable=True, default=dict)
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<Story(id={self.id}, title='{self.title}', status='{self.status}')>"
