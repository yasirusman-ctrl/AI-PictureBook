"""Health check routes."""
import logging
from fastapi import APIRouter
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/health", tags=["health"])

settings = get_settings()


@router.get("/ollama")
async def check_ollama():
    """Check Ollama connection."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            is_connected = resp.status_code == 200
    except Exception as e:
        logger.error(f"Ollama health check failed: {e}")
        is_connected = False
    
    return {
        "service": "ollama",
        "status": "connected" if is_connected else "disconnected",
        "url": settings.OLLAMA_BASE_URL,
        "model": settings.OLLAMA_MODEL,
    }


@router.get("/comfyui")
async def check_comfyui():
    """Check ComfyUI connection."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.COMFYUI_BASE_URL}/system_stats")
            is_connected = resp.status_code == 200
    except Exception as e:
        logger.error(f"ComfyUI health check failed: {e}")
        is_connected = False
    
    return {
        "service": "comfyui",
        "status": "connected" if is_connected else "disconnected",
        "url": settings.COMFYUI_BASE_URL,
        "model": settings.IMAGE_MODEL,
    }


@router.get("/status")
async def status():
    """Get overall system status."""
    ollama_status = await check_ollama()
    comfyui_status = await check_comfyui()
    
    ollama_connected = ollama_status["status"] == "connected"
    comfyui_connected = comfyui_status["status"] == "connected"
    
    return {
        "status": "ready" if (ollama_connected and comfyui_connected) else "partial",
        "services": {
            "ollama": ollama_status,
            "comfyui": comfyui_status,
        },
    }
