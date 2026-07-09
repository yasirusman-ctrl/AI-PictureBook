"""API routes for story management."""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models.story import Story
from app.models.page import Page
from app.services import llm_service, image_service, pdf_service
from app.config import get_settings
from app.database import get_db
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/stories", tags=["stories"])

settings = get_settings()


# Pydantic models for request/response
class PageResponse(BaseModel):
    """Page response model."""
    id: int
    page_number: int
    narration: Optional[str]
    image_prompt: Optional[str]
    image_path: Optional[str]
    status: str

    class Config:
        from_attributes = True


class StoryResponse(BaseModel):
    """Story response model."""
    id: int
    title: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    style: Optional[str]
    tone: Optional[str]
    num_pages: int

    class Config:
        from_attributes = True


class CreateStoryRequest(BaseModel):
    """Request to create a story."""
    concept: str
    style: str = "Pixar"
    tone: str = "whimsical"
    num_pages: int = 16


class UpdatePageRequest(BaseModel):
    """Request to update a page."""
    narration: str
    image_prompt: Optional[str] = None


@router.post("", response_model=StoryResponse)
async def create_story(
    request: CreateStoryRequest,
    db: Session = Depends(get_db),
):
    """Create a new story."""
    try:
        story = Story(
            title="Untitled Story",
            description=request.concept,
            status="draft",
            style=request.style,
            tone=request.tone,
            num_pages=request.num_pages,
            characters_json=json.dumps([]),
        )
        db.add(story)
        db.commit()
        db.refresh(story)
        logger.info(f"Created story {story.id}")
        return story
    except Exception as e:
        logger.error(f"Error creating story: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create story")


@router.get("", response_model=List[StoryResponse])
async def list_stories(db: Session = Depends(get_db)):
    """List all stories."""
    try:
        stories = db.query(Story).order_by(Story.created_at.desc()).all()
        return stories
    except Exception as e:
        logger.error(f"Error listing stories: {e}")
        raise HTTPException(status_code=500, detail="Failed to list stories")


@router.get("/{story_id}", response_model=StoryResponse)
async def get_story(story_id: int, db: Session = Depends(get_db)):
    """Get a specific story."""
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
        return story
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting story {story_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get story")


@router.post("/{story_id}/generate-story")
async def generate_story_outline(story_id: int, db: Session = Depends(get_db)):
    """Generate story outline from concept."""
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        story.status = "generating_outline"
        db.commit()

        try:
            # Generate outline using LLM
            story_data = await llm_service.generate_story_outline(
                story.description or "A children's story",
                story.num_pages,
            )
        except Exception as e:
            logger.error(f"LLM generation error: {e}")
            story.status = "failed"
            story.error_message = str(e)
            db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to generate story outline: {e}")

        # Update story with generated data
        story.title = story_data.get("title", "Untitled Story")
        story.characters_json = json.dumps(story_data.get("characters", []))

        # Create pages
        for page_data in story_data.get("pages", []):
            page = Page(
                story_id=story.id,
                page_number=page_data.get("page_number", 1),
                narration=page_data.get("narration", ""),
                image_prompt=page_data.get("image_prompt", ""),
                status="pending",
            )
            db.add(page)

        story.status = "complete"
        db.commit()
        db.refresh(story)

        logger.info(f"Generated story outline for story {story_id}")
        return {
            "status": "success",
            "message": "Story outline generated",
            "story": story,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating story outline: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate story outline")


@router.post("/{story_id}/generate-images")
async def generate_images(story_id: int, db: Session = Depends(get_db)):
    """Generate images for all pages."""
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        story.status = "generating_images"
        db.commit()

        pages = db.query(Page).filter(Page.story_id == story_id).order_by(Page.page_number).all()
        
        if not pages:
            raise HTTPException(status_code=400, detail="No pages to generate images for. Generate story outline first.")

        # Initialize image service
        img_service = image_service.ImageService()
        
        # Get character sheet for consistency
        characters = json.loads(story.characters_json or "[]")
        character_sheet = "\n".join(
            [f"{c.get('name')}: {c.get('appearance', '')}" for c in characters]
        )

        generated_count = 0
        for page in pages:
            try:
                # Refine prompt with character consistency if available
                if character_sheet:
                    refined_prompt = await llm_service.refine_image_prompt(
                        page.image_prompt,
                        characters,
                    )
                else:
                    refined_prompt = page.image_prompt

                page.image_prompt = refined_prompt
                page.status = "generating"
                db.commit()

                # Generate image
                image_path = await img_service.generate_image(
                    refined_prompt,
                    page.page_number,
                    story_id,
                )

                page.image_path = image_path
                page.status = "complete"
                generated_count += 1
                logger.info(f"Generated image for page {page.page_number}")

            except Exception as e:
                logger.error(f"Failed to generate image for page {page.page_number}: {e}")
                page.status = "failed"
                page.error_message = str(e)

            db.commit()

        story.status = "complete"
        db.commit()

        logger.info(f"Generated {generated_count} images for story {story_id}")
        return {
            "status": "success",
            "message": f"Generated {generated_count}/{len(pages)} images",
            "story_id": story_id,
            "generated_count": generated_count,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating images: {e}")
        story.status = "failed"
        story.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to generate images")


@router.post("/{story_id}/export-pdf")
async def export_pdf(story_id: int, db: Session = Depends(get_db)):
    """Generate and export PDF."""
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        story.status = "generating_pdf"
        db.commit()

        pages = db.query(Page).filter(Page.story_id == story_id).order_by(Page.page_number).all()
        
        if not pages:
            raise HTTPException(status_code=400, detail="No pages to export")

        # Prepare pages for PDF
        page_data = [
            {
                "image_path": page.image_path,
                "narration": page.narration or "",
            }
            for page in pages
        ]

        # Generate PDF
        pdf_service_instance = pdf_service.PDFService()
        pdf_path = pdf_service_instance.generate_story_pdf(
            story_id,
            story.title,
            page_data,
        )

        if not pdf_path:
            raise HTTPException(status_code=500, detail="Failed to generate PDF")

        story.pdf_path = pdf_path
        story.status = "complete"
        db.commit()

        logger.info(f"Generated PDF for story {story_id} at {pdf_path}")
        return {
            "status": "success",
            "message": "PDF generated",
            "pdf_path": pdf_path,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting PDF: {e}")
        story.status = "failed"
        story.error_message = str(e)
        db.commit()
        raise HTTPException(status_code=500, detail="Failed to export PDF")


@router.put("/{story_id}/pages/{page_num}", response_model=PageResponse)
async def update_page(
    story_id: int,
    page_num: int,
    request: UpdatePageRequest,
    db: Session = Depends(get_db),
):
    """Update a page's narration."""
    try:
        page = (
            db.query(Page)
            .filter(Page.story_id == story_id, Page.page_number == page_num)
            .first()
        )
        
        if not page:
            raise HTTPException(status_code=404, detail="Page not found")

        page.narration = request.narration
        if request.image_prompt:
            page.image_prompt = request.image_prompt
        
        db.commit()
        db.refresh(page)

        logger.info(f"Updated page {page_num} of story {story_id}")
        return page

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating page: {e}")
        raise HTTPException(status_code=500, detail="Failed to update page")


@router.post("/{story_id}/pages/{page_num}/regenerate-image")
async def regenerate_page_image(
    story_id: int,
    page_num: int,
    db: Session = Depends(get_db),
):
    """Regenerate image for a specific page."""
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        page = (
            db.query(Page)
            .filter(Page.story_id == story_id, Page.page_number == page_num)
            .first()
        )

        if not page:
            raise HTTPException(status_code=404, detail="Page not found")

        # Get character sheet
        characters = json.loads(story.characters_json or "[]")

        # Refine prompt
        if characters:
            refined_prompt = await llm_service.refine_image_prompt(
                page.image_prompt,
                characters,
            )
        else:
            refined_prompt = page.image_prompt

        page.image_prompt = refined_prompt
        page.status = "generating"
        db.commit()

        # Generate image
        img_service = image_service.ImageService()
        image_path = await img_service.generate_image(
            page.image_prompt,
            page.page_number,
            story_id,
        )

        page.image_path = image_path
        page.status = "complete"
        db.commit()
        db.refresh(page)

        logger.info(f"Regenerated image for page {page_num}")
        return {
            "status": "success",
            "page": page,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating image: {e}")
        raise HTTPException(status_code=500, detail="Failed to regenerate image")


@router.delete("/{story_id}")
async def delete_story(story_id: int, db: Session = Depends(get_db)):
    """Delete a story."""
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # Delete associated pages
        db.query(Page).filter(Page.story_id == story_id).delete()
        
        # Delete story
        db.delete(story)
        db.commit()

        logger.info(f"Deleted story {story_id}")
        return {"status": "success", "message": "Story deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting story: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete story")
