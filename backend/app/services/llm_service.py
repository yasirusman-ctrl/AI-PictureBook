"""LLM service for story generation via Ollama."""
import json
import logging
from typing import Optional
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

STORY_OUTLINE_PROMPT = """You are a children's storybook writer. Create a story outline with exactly {num_pages} pages.

For each page, provide:
- narration: The story text (2-3 sentences, engaging for children)
- image_prompt: A detailed description for generating an illustration (include character appearance, setting, style)

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{{
  "title": "Story Title",
  "characters": [
    {{"name": "Character Name", "description": "Who they are", "appearance": "Physical description"}}
  ],
  "pages": [
    {{"page_number": 1, "narration": "Page text...", "image_prompt": "Image description..."}},
    ...
  ]
}}

Story idea: "{story_idea}"
"""

REFINE_PROMPT_TEMPLATE = """Refine this page's image prompt to ensure character consistency.

Character details:
{character_details}

Original prompt: "{original_prompt}"

Return ONLY the refined prompt as a plain string, no JSON, no markdown.
"""


async def generate_story_outline(story_idea: str, num_pages: int = 16) -> dict:
    """Generate a complete story outline using Ollama."""
    prompt = STORY_OUTLINE_PROMPT.format(num_pages=num_pages, story_idea=story_idea)

    response_text = await _call_ollama(prompt)

    try:
        cleaned = _clean_json_response(response_text)
        outline = json.loads(cleaned)
        _validate_outline(outline, num_pages)
        return outline
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.error("Failed to parse LLM response: %s", e)
        raise RuntimeError(f"Failed to generate story outline: {e}")


async def refine_image_prompt(
    original_prompt: str, character_details: list[dict]
) -> str:
    """Refine an image prompt for character consistency."""
    char_str = "\n".join(
        f"- {c['name']}: {c.get('appearance', '')} ({c.get('description', '')})"
        for c in character_details
    )
    prompt = REFINE_PROMPT_TEMPLATE.format(
        character_details=char_str, original_prompt=original_prompt
    )

    response = await _call_ollama(prompt)
    return response.strip().strip('"').strip("'")


async def _call_ollama(prompt: str, system: Optional[str] = None) -> str:
    """Make a request to Ollama API."""
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    if system:
        payload["system"] = system

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate", json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("response", "")
    except httpx.TimeoutException:
        logger.error("Ollama request timed out")
        raise RuntimeError("LLM request timed out. Check Ollama is running.")
    except httpx.RequestError as e:
        logger.error("Ollama request failed: %s", e)
        raise RuntimeError(f"Failed to connect to Ollama at {settings.OLLAMA_BASE_URL}")
    except Exception as e:
        logger.error("Unexpected LLM error: %s", e)
        raise RuntimeError(f"LLM generation failed: {e}")


def _clean_json_response(text: str) -> str:
    """Clean LLM response text to extract valid JSON."""
    if "```json" in text:
        text = text.split("```json")[1]
        if "```" in text:
            text = text.split("```")[0]
    elif "```" in text:
        text = text.split("```")[1]
        if "```" in text:
            text = text.split("```")[0]

    return text.strip()


def _validate_outline(outline: dict, expected_pages: int) -> None:
    """Validate the outline structure."""
    if "title" not in outline:
        raise ValueError("Outline missing 'title'")
    if "pages" not in outline or not isinstance(outline["pages"], list):
        raise ValueError("Outline missing 'pages' array")
    if len(outline["pages"]) != expected_pages:
        logger.warning(
            "Expected %d pages, got %d", expected_pages, len(outline["pages"])
        )
    for page in outline["pages"]:
        if "page_number" not in page or "narration" not in page or "image_prompt" not in page:
            raise ValueError(f"Page missing required fields: {page}")
