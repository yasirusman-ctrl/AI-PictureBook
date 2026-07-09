"""API routes for the StoryBook Generator."""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.story import Story
from app.models.page import Page
from app.models.character import Character
from app.services.llm_service import generate_story_outline, refine_image_prompt
from app.services.image_service import ImageService
from app.services.pdf_service import PDFService
from app.services.job_queue import job_queue

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["stories"])

image_service = ImageService()
pdf_service = PDFService()


# ── Schemas ──────────────────────────────────────────────────────────

class StoryCreate(BaseModel):
    title: str = Field(default="", max_length=255)
    story_idea: str = Field(default="A magical adventure", max_length=2000)
    num_pages: int = Field(default=16, ge=1, le=32)


class StoryResponse(BaseModel):
    id: int
    title: str
    status: str
    error_message: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PageResponse(BaseModel):
    id: int
    page_number: int
    narration: Optional[str] = None
    image_path: Optional[str] = None
    status: str
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class StoryDetailResponse(StoryResponse):
    pages: list[PageResponse] = []
    characters: list[dict] = []


class JobResponse(BaseModel):
    job_id: str
    status: str
    story_id: int


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/stories", response_model=StoryResponse, status_code=201)
async def create_story(payload: StoryCreate, db: Session = Depends(get_db)):
    """Create a new story (draft)."""
    story = Story(
        title=payload.title or "Untitled Story",
        status="draft",
    )
    db.add(story)
    db.commit()
    db.refresh(story)
    return _story_to_response(story)


@router.get("/stories", response_model=list[StoryResponse])
async def list_stories(
    skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    """List all stories."""
    stories = db.query(Story).order_by(Story.created_at.desc()).offset(skip).limit(limit).all()
    return [_story_to_response(s) for s in stories]


@router.get("/stories/{story_id}", response_model=StoryDetailResponse)
async def get_story(story_id: int, db: Session = Depends(get_db)):
    """Get story details with pages and characters."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    pages = db.query(Page).filter(Page.story_id == story_id).order_by(Page.page_number).all()
    characters = db.query(Character).filter(Character.story_id == story_id).all()

    return _story_detail_response(story, pages, characters)


@router.get("/stories/{story_id}/pages", response_model=list[PageResponse])
async def get_story_pages(story_id: int, db: Session = Depends(get_db)):
    """Get all pages for a story."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    pages = db.query(Page).filter(Page.story_id == story_id).order_by(Page.page_number).all()
    return [_page_to_response(p) for p in pages]


@router.post("/stories/{story_id}/generate", response_model=JobResponse)
async def generate_story(story_id: int, db: Session = Depends(get_db)):
    """Start full story generation: outline -> images -> PDF."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    if story.status not in ("draft", "failed"):
        raise HTTPException(status_code=400, detail=f"Story is already {story.status}")

    job_id = job_queue.enqueue(
        f"Generate story {story_id}",
        _generate_full_story(story_id),
    )
    return JobResponse(job_id=job_id, status="queued", story_id=story_id)


@router.post("/stories/{story_id}/generate-outline", response_model=JobResponse)
async def generate_outline_only(story_id: int, db: Session = Depends(get_db)):
    """Generate only the story outline (narration + prompts)."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    job_id = job_queue.enqueue(
        f"Generate outline for story {story_id}",
        _generate_outline(story_id),
    )
    return JobResponse(job_id=job_id, status="queued", story_id=story_id)


@router.post("/stories/{story_id}/generate-images", response_model=JobResponse)
async def generate_images(story_id: int, db: Session = Depends(get_db)):
    """Generate images for all pages of a story."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    job_id = job_queue.enqueue(
        f"Generate images for story {story_id}",
        _generate_images(story_id),
    )
    return JobResponse(job_id=job_id, status="queued", story_id=story_id)


@router.post("/stories/{story_id}/generate-pdf", response_model=JobResponse)
async def generate_pdf(story_id: int, db: Session = Depends(get_db)):
    """Generate PDF for a completed story."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    job_id = job_queue.enqueue(
        f"Generate PDF for story {story_id}",
        _generate_pdf(story_id),
    )
    return JobResponse(job_id=job_id, status="queued", story_id=story_id)


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a background job."""
    job = job_queue.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_dict()


# ── Background Job Functions ─────────────────────────────────────────

async def _generate_outline(story_id: int) -> dict:
    """Generate story outline and save pages to DB."""
    db = next(get_db())
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise ValueError("Story not found")

        story.status = "generating_outline"
        db.commit()

        outline = await generate_story_outline(story.title, 16)

        story.title = outline.get("title", story.title)
        story.metadata_json = {
            "story_idea": story.title,
            "characters": outline.get("characters", []),
        }

        # Save characters
        for char_data in outline.get("characters", []):
            char = Character(
                story_id=story_id,
                name=char_data.get("name", "Unknown"),
                description=char_data.get("description", ""),
                appearance=char_data.get("appearance", ""),
                consistency_prompt=f"Character: {char_data.get('name')}. Appearance: {char_data.get('appearance')}. {char_data.get('description')}",
            )
            db.add(char)

        # Save pages
        for page_data in outline.get("pages", []):
            page = Page(
                story_id=story_id,
                page_number=page_data.get("page_number", 1),
                narration=page_data.get("narration", ""),
                image_prompt=page_data.get("image_prompt", ""),
                status="pending",
            )
            db.add(page)

        story.status = "outline_complete"
        db.commit()

        return {"status": "success", "pages": len(outline.get("pages", []))}

    except Exception as e:
        logger.error("Outline generation failed: %s", e)
        story = db.query(Story).filter(Story.id == story_id).first()
        if story:
            story.status = "failed"
            story.error_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


async def _generate_images(story_id: int) -> dict:
    """Generate images for all pending pages."""
    db = next(get_db())
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise ValueError("Story not found")

        story.status = "generating_images"
        db.commit()

        pages = (
            db.query(Page)
            .filter(Page.story_id == story_id, Page.status == "pending")
            .order_by(Page.page_number)
            .all()
        )

        if not pages:
            logger.warning("No pending pages to generate images for")
            return {"status": "skipped", "reason": "no pending pages"}

        # Refine prompts with character info
        characters = db.query(Character).filter(Character.story_id == story_id).all()
        char_details = [
            {"name": c.name, "appearance": c.appearance, "description": c.description}
            for c in characters
        ]

        prompts = []
        for page in pages:
            page.status = "generating"
            db.commit()

            refined = page.image_prompt
            if char_details:
                try:
                    refined = await refine_image_prompt(page.image_prompt, char_details)
                except Exception:
                    logger.warning("Prompt refinement failed for page %d, using original", page.page_number)

            prompts.append((page.page_number, refined))

        results = await image_service.generate_images_batch(prompts, story_id)

        for result in results:
            page = (
                db.query(Page)
                .filter(Page.story_id == story_id, Page.page_number == result["page_number"])
                .first()
            )
            if page:
                if result["error"]:
                    page.status = "failed"
                    page.error_message = result["error"]
                else:
                    page.status = "complete"
                    page.image_path = result["path"]
            db.commit()

        story.status = "images_complete"
        db.commit()

        return {"status": "success", "generated": len(results)}

    except Exception as e:
        logger.error("Image generation failed: %s", e)
        story = db.query(Story).filter(Story.id == story_id).first()
        if story:
            story.status = "failed"
            story.error_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


async def _generate_pdf(story_id: int) -> dict:
    """Generate PDF from story pages."""
    db = next(get_db())
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise ValueError("Story not found")

        story.status = "generating_pdf"
        db.commit()

        pages = (
            db.query(Page)
            .filter(Page.story_id == story_id)
            .order_by(Page.page_number)
            .all()
        )

        page_data = [
            {
                "narration": p.narration,
                "image_path": p.image_path,
                "image": p.image_path,
            }
            for p in pages
        ]

        pdf_path = pdf_service.generate_story_pdf(
            story_id=story_id, title=story.title, pages=page_data
        )

        story.metadata_json = story.metadata_json or {}
        if isinstance(story.metadata_json, dict):
            story.metadata_json["pdf_path"] = pdf_path
        story.status = "complete"
        db.commit()

        return {"status": "success", "pdf_path": pdf_path}

    except Exception as e:
        logger.error("PDF generation failed: %s", e)
        story = db.query(Story).filter(Story.id == story_id).first()
        if story:
            story.status = "failed"
            story.error_message = str(e)
            db.commit()
        raise
    finally:
        db.close()


async def _generate_full_story(story_id: int) -> dict:
    """Run the full generation pipeline."""
    await _generate_outline(story_id)
    await _generate_images(story_id)
    result = await _generate_pdf(story_id)
    return result


# ── Helpers ──────────────────────────────────────────────────────────

def _story_to_response(story: Story) -> dict:
    return {
        "id": story.id,
        "title": story.title,
        "status": story.status,
        "error_message": story.error_message,
        "created_at": story.created_at.isoformat() if story.created_at else "",
        "updated_at": story.updated_at.isoformat() if story.updated_at else "",
    }


def _page_to_response(page: Page) -> dict:
    return {
        "id": page.id,
        "page_number": page.page_number,
        "narration": page.narration,
        "image_path": page.image_path,
        "status": page.status,
        "error_message": page.error_message,
    }


def _story_detail_response(story: Story, pages: list[Page], characters: list[Character]) -> dict:
    return {
        "id": story.id,
        "title": story.title,
        "status": story.status,
        "error_message": story.error_message,
        "created_at": story.created_at.isoformat() if story.created_at else "",
        "updated_at": story.updated_at.isoformat() if story.updated_at else "",
        "pages": [_page_to_response(p) for p in pages],
        "characters": [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "appearance": c.appearance,
            }
            for c in characters
        ],
    }
