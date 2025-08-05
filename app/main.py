import json
import os
import base64
from io import BytesIO
from typing import Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from pydantic import BaseModel
try:
    import ollama
    OLLAMA_AVAILABLE = True
except ImportError:
    OLLAMA_AVAILABLE = False
    ollama = None

from .memory import load_memory, save_memory

app = FastAPI(title="SXUDO - Emotionally Intelligent AI Assistant")

# Create static and templates directories
os.makedirs("app/static", exist_ok=True)
os.makedirs("app/templates", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    username: Optional[str] = "default"
    emotion: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    emotion: str
    username: str
    timestamp: str

# Constants
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Main chat interface"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/api/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    """Main chat endpoint"""
    try:
        # Load user memory
        memory = load_memory(chat_message.username)
        
        # Build conversation history for Ollama
        messages = []
        
        # Add system prompt for emotional intelligence
        system_prompt = """You are SXUDO, an emotionally intelligent AI assistant. 
You should be supportive, understanding, and respond to the emotional context of conversations.
Be friendly, helpful, and show empathy. Remember the conversation history and user's name.
Keep responses conversational and warm."""
        
        messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history
        for entry in memory.get("history", []):
            messages.append({"role": "user", "content": entry.get("user", "")})
            messages.append({"role": "assistant", "content": entry.get("assistant", "")})
        
        # Add current message
        messages.append({"role": "user", "content": chat_message.message})
        
        # Get response from Ollama
        try:
            response = ollama.chat(
                model="llama3",  # Default model, can be configured
                messages=messages
            )
            reply = response["message"]["content"]
        except Exception as ollama_error:
            # Fallback if Ollama is not available
            reply = f"I'm sorry, I'm having trouble connecting to my AI service right now. Error: {str(ollama_error)}"
        
        # Simple emotion detection (could be enhanced with ML models)
        emotion = detect_emotion(chat_message.message)
        
        # Save to memory
        memory_entry = {
            "user": chat_message.message,
            "assistant": reply,
            "timestamp": datetime.now().isoformat(),
            "emotion": emotion
        }
        
        if "history" not in memory:
            memory["history"] = []
        memory["history"].append(memory_entry)
        memory["first_interaction"] = False
        
        save_memory(chat_message.username, memory)
        
        return ChatResponse(
            reply=reply,
            emotion=emotion,
            username=chat_message.username,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.post("/api/image-chat")
async def image_chat(
    message: str = Form(...),
    image: UploadFile = File(...),
    username: str = Form("default")
):
    """Image analysis endpoint"""
    try:
        # Read and encode image
        image_content = await image.read()
        image_base64 = base64.b64encode(image_content).decode('utf-8')
        
        # Use LLaVA model for image analysis
        try:
            response = ollama.chat(
                model="llava",
                messages=[{
                    "role": "user",
                    "content": message,
                    "images": [image_base64]
                }]
            )
            reply = response["message"]["content"]
        except Exception as ollama_error:
            reply = f"I'm having trouble analyzing images right now. Error: {str(ollama_error)}"
        
        # Save to memory
        memory = load_memory(username)
        memory_entry = {
            "user": f"[Image] {message}",
            "assistant": reply,
            "timestamp": datetime.now().isoformat(),
            "has_image": True
        }
        
        if "history" not in memory:
            memory["history"] = []
        memory["history"].append(memory_entry)
        
        save_memory(username, memory)
        
        return JSONResponse({
            "reply": reply,
            "username": username,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image chat error: {str(e)}")

@app.post("/api/generate-image")
async def generate_image(
    prompt: str = Form(...),
    username: str = Form("default")
):
    """Image generation endpoint"""
    try:
        # Use SDXL model for image generation
        try:
            response = ollama.generate(
                model="sdxl",
                prompt=prompt
            )
            # Note: This is a simplified implementation
            # In practice, SDXL would return image data
            reply = f"Generated an image with prompt: {prompt}"
        except Exception as ollama_error:
            reply = f"I'm having trouble generating images right now. Error: {str(ollama_error)}"
        
        return JSONResponse({
            "reply": reply,
            "prompt": prompt,
            "username": username,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation error: {str(e)}")

@app.get("/api/memory/{username}")
async def get_memory(username: str):
    """Get user memory/conversation history"""
    try:
        memory = load_memory(username)
        return JSONResponse(memory)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory error: {str(e)}")

@app.delete("/api/memory/{username}")
async def clear_memory(username: str):
    """Clear user memory/conversation history"""
    try:
        memory = {
            "username": username,
            "history": [],
            "first_interaction": True
        }
        save_memory(username, memory)
        return JSONResponse({"message": "Memory cleared successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Memory clear error: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check if Ollama is available
        models = ollama.list()
        return JSONResponse({
            "status": "healthy",
            "ollama_available": True,
            "models": [model["name"] for model in models.get("models", [])]
        })
    except Exception as e:
        return JSONResponse({
            "status": "degraded",
            "ollama_available": False,
            "error": str(e)
        })

def detect_emotion(text: str) -> str:
    """Simple emotion detection based on keywords"""
    text = text.lower()
    
    if any(word in text for word in ["happy", "great", "awesome", "wonderful", "excited", "😊", "😄"]):
        return "😊"
    elif any(word in text for word in ["sad", "upset", "disappointed", "crying", "😢", "😭"]):
        return "😢"
    elif any(word in text for word in ["angry", "mad", "furious", "frustrated", "😠", "😡"]):
        return "😠"
    elif any(word in text for word in ["worried", "nervous", "anxious", "scared", "😰", "😨"]):
        return "😰"
    elif any(word in text for word in ["confused", "lost", "don't understand", "😕"]):
        return "😕"
    else:
        return "😊"  # Default to neutral/friendly

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
