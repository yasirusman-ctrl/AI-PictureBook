# 📖 AI-Powered Children's Picture Book Generator

An MVP for generating 16-page children's picture books using local AI models. Everything runs locally - no accounts needed for OpenAI, Hugging Face, or other AI services.

## 🎯 Project Overview

This project generates children's stories with illustrations entirely locally using:
- **Story Generation**: Ollama + Mistral/Llama 3.2/Qwen 2.5
- **Image Generation**: ComfyUI + SDXL/FLUX.1-devdsadsasd
- **Backend**: FastAPI
- **Frontend**: React (Vite)
- **Database**: SQLite
- **PDF Export**: ReportLab

## 📋 Prerequisitessdsa
asdas
### Backend Requirements
- Python 3.10+
- Ollama (for LLM)
- ComfyUI (for image generation)

### System Requirements
- GPU recommended for image generation (works on CPU but slower)
- At least 8GB RAM
- 20GB+ disk space for models

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 2. Install Local AI Services

#### Ollama (Story Generation)
```bash
# Download from https://ollama.ai
# Or on Linux:
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull mistral
# Or: ollama pull llama2, ollama pull qwen2.5

# Start Ollama
ollama serve
```

#### ComfyUI (Image Generation)
```bash
# Clone ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install dependencies
pip install -r requirements.txt

# Download model (SDXL recommended for most hardware)
# Place model files in models/checkpoints/

# Run ComfyUI
python main.py
# Access at http://localhost:8188
```

### 3. Run Backend

```bash
cd backend
source venv/bin/activate
python main.py
```

Backend runs at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health/status`

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## 📚 API Endpoints

### Stories
- `POST /api/stories` - Create new story
- `GET /api/stories` - List all stories
- `GET /api/stories/{id}` - Get story details
- `POST /api/stories/{id}/generate-story` - Generate story outline
- `POST /api/stories/{id}/generate-images` - Generate images for pages
- `POST /api/stories/{id}/export-pdf` - Export as PDF
- `PUT /api/stories/{id}/pages/{page_num}` - Edit page
- `POST /api/stories/{id}/pages/{page_num}/regenerate-image` - Regenerate page image
- `DELETE /api/stories/{id}` - Delete story

### Health Checks
- `GET /api/health/ollama` - Check Ollama connection
- `GET /api/health/comfyui` - Check ComfyUI connection
- `GET /api/health/status` - Overall system status

## 🔧 Configuration

Edit backend configuration in `backend/.env`:

```env
# LLM Settings
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# Image Generation
COMFYUI_BASE_URL=http://localhost:8188
IMAGE_MODEL=SDXL

# Database
DATABASE_URL=sqlite:///./storybook.db

# Storage paths
STORAGE_PATH=./storage
IMAGES_PATH=./storage/images
PDFS_PATH=./storage/pdfs
```

## 📖 Usage Workflow

### Phase 1: MVP (Week 1-2)

1. **Create Story**
   - Input story concept
   - Select art style (Pixar, anime, watercolor, etc.)
   - Choose number of pages (default: 16)

2. **Generate Outline**
   - Backend calls Ollama to create story with narration
   - Returns title, characters, and page descriptions

3. **Generate Images**
   - For each page, refine prompt with character sheet
   - Queue image generation in ComfyUI
   - Poll for completion and save images

4. **Export PDF**
   - Combine images + narration into single PDF
   - Download to computer

### Example Request Flow

```bash
# 1. Create story
curl -X POST http://localhost:8000/api/stories \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "A brave little fox learns to make friends",
    "style": "Pixar",
    "tone": "whimsical",
    "num_pages": 16
  }'

# Response: { "id": 1, "title": "Untitled Story", "status": "draft" }

# 2. Generate outline
curl -X POST http://localhost:8000/api/stories/1/generate-story

# 3. Generate images
curl -X POST http://localhost:8000/api/stories/1/generate-images

# 4. Export PDF
curl -X POST http://localhost:8000/api/stories/1/export-pdf
```

## 🗂️ Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── story.py
│   │   │   ├── page.py
│   │   │   └── character.py
│   │   ├── routes/
│   │   │   ├── stories.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── llm_service.py
│   │   │   ├── image_service.py
│   │   │   └── pdf_service.py
│   │   ├── config.py
│   │   └── database.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## 🔄 Development Roadmap

### Week 1: MVP Core
- ✅ Backend setup with FastAPI
- ✅ Database models
- ✅ LLM integration (Ollama)
- ✅ Image service scaffold (ComfyUI)
- ⬜ Frontend basic UI
- ⬜ Story creation & generation

### Week 2: Frontend & Integration
- ⬜ React components
- ⬜ API integration
- ⬜ Story editor UI
- ⬜ PDF export

### Week 3+: Enhancements
- Character consistency
- Multiple art styles
- EPUB export
- Comic generation support

## ⚠️ Troubleshooting

### "Failed to connect to Ollama"
- Ensure Ollama is running: `ollama serve`
- Check `OLLAMA_BASE_URL` in `.env`
- Verify port 11434 is accessible

### "Failed to connect to ComfyUI"
- Ensure ComfyUI is running: `python main.py` in ComfyUI directory
- Check `COMFYUI_BASE_URL` in `.env`
- Verify port 8188 is accessible
- Ensure model files are in correct directory

### Images not generating
- Check VRAM: ComfyUI needs 4GB+ for SDXL
- Try SDXL model first (requires less VRAM than FLUX.1-dev)
- Check ComfyUI logs for errors

### Database locked
- Delete `storybook.db` and restart backend
- Only one process should access database at a time

## 📝 Notes

- All models are downloaded locally (requires 10-20GB disk space)
- First story generation takes longer (model loading)
- Image generation is CPU/GPU intensive - expect 30-60s per page
- PDF generation is fast (~2-5s for 16 pages)

## 🤝 Contributing

This is an MVP project. Areas for improvement:
- Character consistency algorithms
- Better prompt engineering
- Async task queuing (Celery/RQ)
- Caching strategies
- UI/UX enhancements

## 📄 License

MIT

---

**Happy story creating! 🎨📚**
