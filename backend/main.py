"""Main FastAPI application."""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.config import get_settings
from app.database import init_db
from app.routes import stories, health

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

settings = get_settings()

# Create app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    debug=settings.DEBUG,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    # Create storage directories
    Path(settings.STORAGE_PATH).mkdir(parents=True, exist_ok=True)
    Path(settings.IMAGES_PATH).mkdir(parents=True, exist_ok=True)
    Path(settings.PDFS_PATH).mkdir(parents=True, exist_ok=True)
    
    # Initialize database
    init_db()
    logging.info("Database initialized")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "StoryBook Generator API",
        "version": settings.API_VERSION,
        "docs": "/docs",
    }


# Include routers
app.include_router(stories.router)
app.include_router(health.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
