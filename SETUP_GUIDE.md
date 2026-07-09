# ⚙️ Setup Guide for Ollama and ComfyUI

## Prerequisites

### System Requirements
- **Ollama**: Works on Linux, macOS, Windows
- **ComfyUI**: Works on Linux, macOS, Windows (requires Python 3.10+)
- **GPU**: Recommended for image generation (4GB+ VRAM)
- **Disk Space**: ~20GB for models

---

## 1. Installing Ollama

### Linux
```bash
# Download and install
curl https://ollama.ai/install.sh | sh

# Or use snap (Ubuntu/Fedora)
sudo snap install ollama

# Verify installation
ollama --version
```

### macOS
```bash
# Download DMG from https://ollama.ai/download
# Or use Homebrew
brew install ollama

# Verify
ollama --version
```

### Windows
```bash
# Download Windows installer from https://ollama.ai/download
# Run the installer
# Verify in PowerShell
ollama --version
```

### Pulling Models

After installation, pull a model:

```bash
# Mistral (recommended for MVP) - ~5GB
ollama pull mistral

# Or alternative models
ollama pull llama2          # ~4GB
ollama pull qwen2.5         # ~5GB
ollama pull neural-chat     # ~4GB

# List available models
ollama list
```

### Running Ollama

```bash
# Start Ollama server (runs on port 11434)
ollama serve

# Or as a background service (on Linux)
sudo systemctl start ollama
```

**Test Ollama:**
```bash
curl http://localhost:11434/api/tags
# Should return list of models
```

---

## 2. Installing ComfyUI

### Linux/macOS

```bash
# Clone ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download model (choose one)
cd models/checkpoints

# SDXL (recommended for MVP) - ~7GB
# Download from HuggingFace: https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
# Place as: sd_xl_base_1.0.safetensors

# Or FLUX.1-dev (better quality but needs more VRAM) - ~13GB
# Download from: https://huggingface.co/black-forest-labs/FLUX.1-dev

cd ../..

# Run ComfyUI
python main.py

# Access at http://localhost:8188
```

### Windows

```bash
# Clone ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download model (see above for links)

# Run ComfyUI
python main.py
```

**Test ComfyUI:**
```bash
curl http://localhost:8188/system_stats
# Should return system information
```

---

## 3. Downloading Models

### Option A: Hugging Face (Free, requires account)

1. Go to https://huggingface.co
2. Create free account
3. Accept model license
4. Use git-lfs to download:

```bash
cd ComfyUI/models/checkpoints
git clone https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0
# Move the .safetensors file
mv stable-diffusion-xl-base-1.0/sd_xl_base_1.0.safetensors ./
rm -rf stable-diffusion-xl-base-1.0
```

### Option B: Manual Download

Visit HuggingFace model pages, download `.safetensors` files directly, and place in `ComfyUI/models/checkpoints/`

### Option C: Use ComfyUI Manager

In ComfyUI web UI, use the "Manager" node to download models directly

---

## 4. Troubleshooting

### Ollama Won't Start
```bash
# Check if already running
lsof -i :11434  # Linux/macOS
netstat -ano | findstr :11434  # Windows

# Kill existing process and restart
kill <PID>
ollama serve
```

### Model Download Failed
- Check internet connection
- Ensure enough disk space (20GB+)
- Try downloading via HuggingFace web UI instead

### ComfyUI Connection Errors
- Ensure ComfyUI is running: `python main.py`
- Check port 8188 is not blocked: `curl http://localhost:8188`
- Check firewall settings

### Out of Memory (VRAM)
- Use SDXL instead of FLUX.1-dev
- Reduce batch size
- Use CPU mode (slower but works)

### Slow Image Generation
- Expected: 30-60s per page on GPU
- Expected: 2-5 min per page on CPU
- Check GPU usage: `nvidia-smi` (NVIDIA) or `rocm-smi` (AMD)

---

## 5. Quick Start Script

Create `start.sh` (Linux/macOS) or `start.bat` (Windows):

### Linux/macOS (start.sh):
```bash
#!/bin/bash

echo "Starting Ollama..."
ollama serve &
OLLAMA_PID=$!
sleep 2

echo "Starting ComfyUI..."
cd ComfyUI
source venv/bin/activate
python main.py &
COMFYUI_PID=$!
sleep 5

echo "Starting Backend..."
cd ../backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!

echo "All services started!"
echo "Ollama: http://localhost:11434"
echo "ComfyUI: http://localhost:8188"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"

# Wait for all processes
wait
```

### Windows (start.bat):
```batch
@echo off

echo Starting Ollama...
start cmd /k "ollama serve"
timeout /t 2

echo Starting ComfyUI...
start cmd /k "cd ComfyUI && venv\Scripts\activate && python main.py"
timeout /t 5

echo Starting Backend...
start cmd /k "cd backend && venv\Scripts\activate && python main.py"

echo.
echo All services started!
echo Ollama: http://localhost:11434
echo ComfyUI: http://localhost:8188
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
```

---

## 6. Model Selection Guide

| Model | Size | VRAM | Quality | Speed |
|-------|------|------|---------|-------|
| **SDXL** | 7GB | 4GB+ | Good | Fast ✓ |
| **FLUX.1-dev** | 13GB | 8GB+ | Excellent | Slow |
| **Mistral (LLM)** | 5GB | 2GB+ | Good | Fast ✓ |
| **Qwen 2.5 (LLM)** | 5GB | 2GB+ | Excellent | Fast ✓ |

**Recommendation for MVP:** SDXL + Mistral

---

**Happy generating! 🎨📚**
