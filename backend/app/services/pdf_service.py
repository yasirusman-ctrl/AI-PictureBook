"""PDF generation service using ReportLab."""
import logging
import os
from pathlib import Path
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 20 * mm
IMAGE_HEIGHT_RATIO = 0.6


class PDFService:
    """Service for generating PDF storybooks."""

    def __init__(self):
        self.output_dir = Path(settings.PDFS_PATH)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_story_pdf(
        self,
        story_id: int,
        title: str,
        pages: list[dict],
        output_path: Optional[str] = None,
    ) -> str:
        """Generate a PDF combining images and narration text."""
        if output_path is None:
            filename = f"story_{story_id}.pdf"
            output_path = str(self.output_dir / filename)

        c = canvas.Canvas(output_path, pagesize=A4)

        if pages:
            self._draw_title_page(c, title)

        for page_data in pages:
            if self._has_image(page_data):
                c.showPage()
                self._draw_page_with_image(c, page_data)
            else:
                c.showPage()
                self._draw_text_page(c, page_data["narration"])

        c.save()
        logger.info("PDF saved to %s", output_path)
        return output_path

    def _draw_title_page(self, c: canvas.Canvas, title: str) -> None:
        """Draw the title page."""
        c.showPage()
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 50, title)

        c.setFont("Helvetica", 14)
        c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT / 2, "A StoryBook Generator Production")

    def _draw_page_with_image(self, c: canvas.Canvas, page_data: dict) -> None:
        """Draw a page with image on top and narration below."""
        image_path = page_data.get("image_path") or page_data.get("image")
        narration = page_data.get("narration", "")

        if image_path and os.path.exists(image_path):
            try:
                img = Image.open(image_path)
                img_width, img_height = img.size

                max_img_width = PAGE_WIDTH - 2 * MARGIN
                max_img_height = PAGE_HEIGHT * IMAGE_HEIGHT_RATIO - MARGIN

                scale = min(max_img_width / img_width, max_img_height / img_height)
                draw_width = img_width * scale
                draw_height = img_height * scale

                x = (PAGE_WIDTH - draw_width) / 2
                y = PAGE_HEIGHT - MARGIN - draw_height

                c.drawImage(ImageReader(image_path), x, y, width=draw_width, height=draw_height)
            except Exception as e:
                logger.warning("Could not load image %s: %s", image_path, e)
                c.setFont("Helvetica", 12)
                c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT / 2, "[Image could not be loaded]")

        text_y = PAGE_HEIGHT * IMAGE_HEIGHT_RATIO - MARGIN - 20
        if text_y < MARGIN:
            text_y = MARGIN + 20

        c.setFont("Helvetica", 11)
        text_object = c.beginText(MARGIN, text_y)
        text_object.setTextOrigin(MARGIN, text_y)
        text_object.setLeading(16)

        max_text_width = PAGE_WIDTH - 2 * MARGIN
        words = narration.split()
        line = ""
        for word in words:
            test_line = f"{line} {word}".strip()
            if c.stringWidth(test_line, "Helvetica", 11) < max_text_width:
                line = test_line
            else:
                text_object.textLine(line)
                line = word
        if line:
            text_object.textLine(line)

        c.drawText(text_object)

    def _draw_text_page(self, c: canvas.Canvas, narration: str) -> None:
        """Draw a full text page (for pages without images)."""
        c.setFont("Helvetica", 12)
        text_object = c.beginText(MARGIN, PAGE_HEIGHT - MARGIN)
        text_object.setLeading(18)

        max_text_width = PAGE_WIDTH - 2 * MARGIN
        words = narration.split()
        line = ""
        for word in words:
            test_line = f"{line} {word}".strip()
            if c.stringWidth(test_line, "Helvetica", 12) < max_text_width:
                line = test_line
            else:
                text_object.textLine(line)
                line = word
        if line:
            text_object.textLine(line)

        c.drawText(text_object)

    @staticmethod
    def _has_image(page_data: dict) -> bool:
        """Check if page data has a valid image reference."""
        path = page_data.get("image_path") or page_data.get("image")
        return bool(path and os.path.exists(path))
