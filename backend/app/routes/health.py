"""Health check routes."""
import logging
from fastapi import APIRouter
from app.services.llm_service import OllamaService
from app.services.image_service import ComfyUIService
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/health", tags=["health"])

settings = get_settings()


@router.get("/ollama")
async def check_ollama():
    """Check Ollama connection."""
    llm_service = OllamaService(settings.OLLAMA_BASE_URL, settings.OLLAMA_MODEL)
    is_connected = llm_service.check_connection()
    
    return {
        "service": "ollama",
        "status": "connected" if is_connected else "disconnected",
        "url": settings.OLLAMA_BASE_URL,
        "model": settings.OLLAMA_MODEL,
    }


@router.get("/comfyui")
async def check_comfyui():
    """Check ComfyUI connection."""
    image_service = ComfyUIService(
        settings.COMFYUI_BASE_URL,
        settings.IMAGE_MODEL,
        settings.IMAGES_PATH,
    )
    is_connected = image_service.check_connection()
    
    return {
        "service": "comfyui",
        "status": "connected" if is_connected else "disconnected",
        "url": settings.COMFYUI_BASE_URL,
        "model": settings.IMAGE_MODEL,
    }


@router.get("/status")
async def status():
    """Get overall system status."""
    llm_service = OllamaService(settings.OLLAMA_BASE_URL, settings.OLLAMA_MODEL)
    image_service = ComfyUIService(
        settings.COMFYUI_BASE_URL,
        settings.IMAGE_MODEL,
        settings.IMAGES_PATH,
    )
    
    ollama_connected = llm_service.check_connection()
    comfyui_connected = image_service.check_connection()
    
    return {
        "status": "ready" if (ollama_connected and comfyui_connected) else "partial",
        "services": {
            "ollama": "connected" if ollama_connected else "disconnected",
            "comfyui": "connected" if comfyui_connected else "disconnected",
        },
    }
