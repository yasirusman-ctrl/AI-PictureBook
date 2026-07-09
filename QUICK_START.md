# 🚀 Backend Running - Next Steps

## ✅ Current Status

- **Backend Server**: Running on `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Database**: SQLite initialized at `backend/storybook.db`
- **Storage**: Directories created at `backend/storage/`

## 📋 What's Ready

### Backend Services
- ✅ FastAPI REST API
- ✅ SQLite database with Story/Page models
- ✅ Ollama LLM service (async)
- ✅ ComfyUI image service (async)
- ✅ ReportLab PDF service
- ✅ Health check endpoints

### API Endpoints (28 total)

**Stories Management:**
- `POST /api/stories` - Create story
- `GET /api/stories` - List all stories
- `GET /api/stories/{id}` - Get story details
- `DELETE /api/stories/{id}` - Delete story

**Story Generation:**
- `POST /api/stories/{id}/generate-story` - Generate outline from concept
- `POST /api/stories/{id}/generate-images` - Generate images for all pages
- `POST /api/stories/{id}/export-pdf` - Create PDF

**Page Editing:**
- `PUT /api/stories/{id}/pages/{page_num}` - Edit page text
- `POST /api/stories/{id}/pages/{page_num}/regenerate-image` - Regenerate single image

**Health Checks:**
- `GET /api/health/ollama` - Check Ollama status
- `GET /api/health/comfyui` - Check ComfyUI status
- `GET /api/health/status` - Full system status

## 🔧 Install External Services

### 1. Ollama (Story Generation)

```bash
# Install Ollama (choose one method)
curl https://ollama.ai/install.sh | sh           # Linux
# or
brew install ollama                              # macOS
# or Download from https://ollama.ai              # Windows

# Pull a model
ollama pull mistral

# Start Ollama (new terminal)
ollama serve
# Runs on http://localhost:11434
```

### 2. ComfyUI (Image Generation)

```bash
# Clone and setup
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Download model (choose one - takes 5-15 min)
cd models/checkpoints
# Download sd_xl_base_1.0.safetensors from HuggingFace
# Place in this directory

cd ../..

# Start ComfyUI (new terminal)
python main.py
# Runs on http://localhost:8188
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

## 🧪 Test Backend API

### 1. Check System Health
```bash
curl http://localhost:8000/api/health/status
```

Expected response:
```json
{
  "status": "partial",
  "services": {
    "ollama": {
      "service": "ollama",
      "status": "disconnected",
      "url": "http://localhost:11434"
    },
    "comfyui": {
      "service": "comfyui",
      "status": "disconnected",
      "url": "http://localhost:8188"
    }
  }
}
```

### 2. Create a Story
```bash
curl -X POST http://localhost:8000/api/stories \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "A brave little fox learns to make friends",
    "style": "Pixar",
    "tone": "whimsical",
    "num_pages": 16
  }'
```

Response:
```json
{
  "id": 1,
  "title": "Untitled Story",
  "description": "A brave little fox learns to make friends",
  "status": "draft",
  "style": "Pixar",
  "tone": "whimsical",
  "num_pages": 16
}
```

### 3. Generate Story Outline (requires Ollama running)
```bash
curl -X POST http://localhost:8000/api/stories/1/generate-story
```

### 4. Generate Images (requires ComfyUI running)
```bash
curl -X POST http://localhost:8000/api/stories/1/generate-images
```

### 5. Export PDF
```bash
curl -X POST http://localhost:8000/api/stories/1/export-pdf
```

## 📚 API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger UI where you can:
- View all endpoints
- See required parameters
- Test API calls directly
- View response schemas

## 🎯 Next: Frontend Setup

When ready, set up the React frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

See [README.md](./README.md) for complete setup guide.

## 📁 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # LLM, image, PDF services
│   │   ├── config.py        # Settings
│   │   ├── database.py      # DB connection
│   │   └── __init__.py
│   ├── main.py              # FastAPI app entry
│   ├── requirements.txt     # Dependencies
│   ├── .env                 # Configuration
│   ├── venv/                # Virtual environment
│   └── storybook.db         # SQLite database
├── frontend/                # React (Vite)
├── storage/                 # Generated images & PDFs
├── README.md                # Main documentation
├── SETUP_GUIDE.md          # Ollama & ComfyUI setup
├── .gitignore              # Git ignore rules
└── .env                    # (optional) Top-level env
```

## ⚙️ Configuration

Backend configuration in `backend/.env`:
- `OLLAMA_BASE_URL` - Ollama API endpoint (default: http://localhost:11434)
- `OLLAMA_MODEL` - Model to use (default: mistral)
- `COMFYUI_BASE_URL` - ComfyUI endpoint (default: http://localhost:8188)
- `IMAGE_MODEL` - Image model (default: SDXL)
- `DATABASE_URL` - SQLite database path

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check port 8000 is free
lsof -i :8000      # Linux/macOS
netstat -ano | grep 8000  # Windows

# Check logs for errors
cat backend/storybook.db  # If corrupted, delete and restart
```

### "Connection refused"
- Ensure Ollama is running: `ollama serve`
- Ensure ComfyUI is running: `python main.py` in ComfyUI folder
- Check firewall settings

### Database errors
```bash
# Reset database
cd backend
rm storybook.db
python main.py
```

## 📞 Support

- API Docs: http://localhost:8000/docs
- Backend logs: Terminal where `python main.py` runs
- Check `SETUP_GUIDE.md` for external services
- Review `README.md` for architecture

---

**Backend ready! 🎉 Install Ollama & ComfyUI, then build the frontend.**
