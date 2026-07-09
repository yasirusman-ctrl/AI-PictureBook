"""Configuration for the backend application."""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings."""

    # API settings
    API_TITLE: str = "StoryBook Generator API"
    API_VERSION: str = "0.1.0"
    DEBUG: bool = True

    # LLM settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral"  # Can also use "llama2", "qwen2.5"

    # Image generation settings
    COMFYUI_BASE_URL: str = "http://localhost:8188"
    IMAGE_MODEL: str = "SDXL"  # Can use "FLUX.1-dev" if GPU has enough VRAM

    # Database settings
    DATABASE_URL: str = "sqlite:///./storybook.db"
    SQLALCHEMY_ECHO: bool = False

    # File storage settings
    STORAGE_PATH: str = os.path.join(os.getcwd(), "storage")
    IMAGES_PATH: str = os.path.join(os.getcwd(), "storage", "images")
    PDFS_PATH: str = os.path.join(os.getcwd(), "storage", "pdfs")

    # Default story settings
    DEFAULT_PAGES: int = 16
    IMAGE_WIDTH: int = 1024
    IMAGE_HEIGHT: int = 1024

    class Config:
        """Pydantic config."""

        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    """Get settings instance."""
    return Settings()
