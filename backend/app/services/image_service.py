"""Image generation service for ComfyUI integration."""
import asyncio
import json
import logging
import os
import uuid
from pathlib import Path
from typing import Optional
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class ImageService:
    """Service for generating images via ComfyUI."""

    def __init__(self):
        self.base_url = settings.COMFYUI_BASE_URL
        self.output_dir = Path(settings.IMAGES_PATH)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._poll_interval = 2.0
        self._max_polls = 150

    async def generate_image(self, prompt: str, page_number: int, story_id: int) -> str:
        """Generate an image from a text prompt and return the saved file path."""
        workflow = self._build_workflow(prompt)

        try:
            client = httpx.AsyncClient(timeout=30.0)
            resp = await client.post(
                f"{self.base_url}/prompt", json={"prompt": workflow}
            )
            resp.raise_for_status()
            result = resp.json()
            prompt_id = result.get("prompt_id")
            if not prompt_id:
                raise RuntimeError("No prompt_id returned from ComfyUI")

            logger.info("Queued image %d (prompt_id=%s)", page_number, prompt_id)

            image_data = await self._poll_for_result(client, prompt_id)

            filename = f"story_{story_id}_page_{page_number:02d}_{uuid.uuid4().hex[:8]}.png"
            filepath = self.output_dir / filename

            with open(filepath, "wb") as f:
                f.write(image_data)

            logger.info("Saved image to %s", filepath)
            return str(filepath)

        except httpx.RequestError as e:
            logger.error("ComfyUI request failed: %s", e)
            raise RuntimeError(f"Failed to connect to ComfyUI at {self.base_url}")
        except Exception as e:
            logger.error("Image generation failed for page %d: %s", page_number, e)
            raise
        finally:
            await client.aclose()

    def _build_workflow(self, prompt: str) -> dict:
        """Build a ComfyUI workflow JSON for text-to-image generation."""
        workflow = {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": hash(prompt) % (2**32),
                    "steps": 20,
                    "cfg": 7.0,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1.0,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0],
                },
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": settings.IMAGE_MODEL},
            },
            "5": {
                "class_type": "EmptyLatentImage",
                "inputs": {
                    "width": settings.IMAGE_WIDTH,
                    "height": settings.IMAGE_HEIGHT,
                    "batch_size": 1,
                },
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1],
                },
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": "text, watermark, signature, ugly, distorted",
                    "clip": ["4", 1],
                },
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2],
                },
            },
            "9": {
                "class_type": "SaveImage",
                "inputs": {
                    "filename_prefix": "storybook",
                    "images": ["8", 0],
                },
            },
        }
        return workflow

    async def _poll_for_result(self, client: httpx.AsyncClient, prompt_id: str) -> bytes:
        """Poll ComfyUI until the image is generated."""
        history_url = f"{self.base_url}/history/{prompt_id}"

        for _ in range(self._max_polls):
            await asyncio.sleep(self._poll_interval)

            try:
                resp = await client.get(history_url)
                if resp.status_code != 200:
                    continue

                history = resp.json()
                if prompt_id not in history:
                    continue

                prompt_data = history[prompt_id]
                outputs = prompt_data.get("outputs", {})

                for node_id, node_output in outputs.items():
                    images = node_output.get("images", [])
                    if images:
                        img_info = images[0]
                        filename = img_info.get("filename")
                        subfolder = img_info.get("subfolder", "")
                        img_resp = await client.get(
                            f"{self.base_url}/view",
                            params={"filename": filename, "subfolder": subfolder},
                        )
                        img_resp.raise_for_status()
                        return img_resp.content

            except httpx.RequestError:
                logger.debug("Poll attempt failed, retrying...")
                continue

        raise TimeoutError("Image generation timed out")

    async def generate_images_batch(
        self, prompts: list[tuple[int, str]], story_id: int
    ) -> list[dict]:
        """Generate images for multiple pages concurrently."""
        tasks = [
            self.generate_image(prompt, page_num, story_id)
            for page_num, prompt in prompts
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        output = []
        for (page_num, _), result in zip(prompts, results):
            if isinstance(result, Exception):
                logger.error("Page %d image failed: %s", page_num, result)
                output.append({"page_number": page_num, "path": None, "error": str(result)})
            else:
                output.append({"page_number": page_num, "path": result, "error": None})
        return output
