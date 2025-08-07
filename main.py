from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from typing import Optional
from pathlib import Path
from PIL import Image
import ollama
import json
import os
import io

app = FastAPI(title="SXUDO AI Assistant", version="1.0")

# Base directory setup
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
MEMORY_FILE = BASE_DIR.parent / "memory.json"

# Ensure required folders exist
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(TEMPLATES_DIR, exist_ok=True)

# Mount static files and templates
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

# Favicon handler
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(STATIC_DIR / "favicon.ico")

# System prompt
SYSTEM_PROMPT = """You are SXUDO, an emotionally intelligent AI assistant created by Madhur Kharade.
Respond with warmth and understanding, always maintaining your identity."""

# Memory load/save helpers
def load_memory():
    try:
        if MEMORY_FILE.exists():
            with open(MEMORY_FILE, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading memory: {e}")
    return {"users": {}}

def save_memory(memory):
    try:
        with open(MEMORY_FILE, 'w') as f:
            json.dump(memory, f, indent=2)
    except Exception as e:
        print(f"Error saving memory: {e}")

# Home route
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "version": app.version
    })

# Chat endpoint
@app.post("/api/chat")
async def chat(
    message: str = Form(...),
    user_id: str = Form(...),
    history: Optional[str] = Form(None)
):
    try:
        memory = load_memory()
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if history:
            try:
                history_data = json.loads(history)
                for msg in history_data:
                    if msg.get("user"):
                        messages.append({"role": "user", "content": msg["user"]})
                    if msg.get("sxudo"):
                        messages.append({"role": "assistant", "content": msg["sxudo"]})
            except json.JSONDecodeError:
                pass

        messages.append({"role": "user", "content": message})

        response = ollama.chat(
            model='llama3',
            messages=messages,
            options={'temperature': 0.7}
        )

        ai_response = response['message']['content']

        if user_id not in memory["users"]:
            memory["users"][user_id] = {"history": []}

        memory["users"][user_id]["history"].append({
            "user": message,
            "sxudo": ai_response
        })

        save_memory(memory)

        return JSONResponse({"response": ai_response})
    
    except Exception as e:
        raise HTTPException(500, detail=f"Chat error: {str(e)}")

# Image analysis endpoint
@app.post("/api/analyze_image")
async def analyze_image(
    file: UploadFile = File(...),
    prompt: str = Form("What's in this image?")
):
    try:
        image_data = await file.read()

        try:
            img = Image.open(io.BytesIO(image_data))
            img.verify()
        except Exception:
            raise HTTPException(400, detail="Invalid image file")

        response = ollama.chat(
            model='llava',
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            images=[image_data],
            options={'temperature': 0.5}
        )

        return JSONResponse({"response": response['message']['content']})
    
    except Exception as e:
        raise HTTPException(500, detail=f"Image analysis error: {str(e)}")

# Run with: `uvicorn app.main:app --reload`
