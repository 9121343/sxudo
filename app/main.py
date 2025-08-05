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

def generate_intelligent_demo_response(message: str, username: str, history: list) -> str:
    """Generate intelligent demo responses when Ollama is not available"""
    message_lower = message.lower().strip()

    # Greeting responses
    if any(word in message_lower for word in ["hello", "hi", "hey", "heyy", "greetings"]):
        return f"Hello {username}! I'm SXUDO, your emotionally intelligent AI assistant created by Madhur Kharade. I'm here to help you with any questions, provide support, or just have a friendly conversation. How can I assist you today?"

    # Einstein question
    if "einstein" in message_lower:
        return """Albert Einstein (1879-1955) was one of the most influential physicists in history! Here are some key facts about him:

🧠 **Revolutionary Theories:**
• Developed the theory of special relativity (1905) with the famous equation E=mc²
• Created the theory of general relativity (1915), revolutionizing our understanding of gravity
• Won the Nobel Prize in Physics (1921) for his work on photoelectric effect

🌟 **Key Contributions:**
• Showed that space and time are interconnected (spacetime)
• Predicted black holes, gravitational waves, and GPS satellite corrections
• Laid groundwork for quantum mechanics and modern cosmology

💭 **Philosophy:** Known for quotes like "Imagination is more important than knowledge" and "The important thing is not to stop questioning."

Einstein fundamentally changed how we understand the universe!"""

    # Colors/sky question
    if any(word in message_lower for word in ["color", "colour", "sky"]):
        return """The sky appears blue during the day due to a fascinating physics phenomenon called **Rayleigh scattering**!

🌈 **Why the sky is blue:**
• Sunlight contains all colors of the rainbow
• Blue light has a shorter wavelength than red light
• When sunlight hits Earth's atmosphere, blue light gets scattered more in all directions
• This makes the sky appear blue to our eyes

🌅 **Other sky colors:**
• **Sunrise/Sunset:** Orange/red (light travels through more atmosphere)
• **Night:** Black/dark blue (no sunlight to scatter)
• **Storms:** Gray/dark (clouds block and scatter light differently)

There are actually millions of colors visible to humans - roughly 10 million different shades!"""

    # Phone recommendations
    if "phone" in message_lower and "india" in message_lower:
        return """Here are some of the best phones in India across different price ranges:

📱 **Premium Segment (₹80,000+):**
• iPhone 15 Pro/Pro Max - Excellent cameras, premium build
• Samsung Galaxy S24 Ultra - S Pen, great cameras, large display
• Google Pixel 8 Pro - Best Android camera AI

💎 **Mid-Premium (₹40,000-80,000):**
• OnePlus 12 - Fast charging, great performance
• iPhone 14/15 - Reliable, long software support
• Samsung Galaxy S23 FE - Good all-rounder

💰 **Mid-Range (₹20,000-40,000):**
• Nothing Phone 2 - Unique design, clean Android
• Pixel 7a - Excellent cameras for price
• Samsung Galaxy A54 - Good display, cameras

🔥 **Budget (Under ₹20,000):**
• Poco X6 - Great performance for gaming
• Realme 12 Pro - Good cameras, fast charging
• Samsung Galaxy M34 - Long battery life

**Recommendation:** Consider your priorities - camera, gaming, battery, or overall experience!"""

    # Colors question
    if "how many" in message_lower and "color" in message_lower:
        return """Great question! The number of colors depends on how we define and perceive them:

🎨 **Human Vision:**
• Humans can distinguish approximately **10 million different colors**
• We have 3 types of color receptors (red, green, blue cones)
• This gives us "trichromatic" color vision

🌈 **Visible Spectrum:**
• Contains infinite gradations between wavelengths (~380-750 nanometers)
• Traditional rainbow has 7 main colors: Red, Orange, Yellow, Green, Blue, Indigo, Violet

💻 **Digital Colors:**
• RGB: 16.7 million possible combinations (256³)
• Pantone system: ~2,000+ standardized colors
• Web colors: 140 named colors in CSS

🔬 **Beyond Human Vision:**
• UV and infrared light contain "colors" we can't see
• Some animals see many more colors than humans
• Mantis shrimp can see 16 types of color receptors (vs our 3)!

So the answer ranges from 7 basic colors to millions of distinguishable shades!"""

    # Default intelligent response
    responses = [
        f"That's an interesting question, {username}! While I'm currently running in demonstration mode, I can still help you explore ideas and provide thoughtful responses. What specific aspect would you like to dive deeper into?",
        f"Hello {username}! I appreciate you reaching out. Even in demo mode, I'm designed to be helpful and engaging. Could you tell me more about what you're looking for?",
        f"Great to chat with you, {username}! I'm SXUDO, created by Madhur Kharade to be emotionally intelligent and supportive. What's on your mind today?",
        f"Hi {username}! While I'm running in demonstration mode, I'm still here to help with questions, provide information, or just have a friendly conversation. How can I assist you?"
    ]

    # Use a simple hash of the message to pick a consistent response
    response_index = hash(message_lower) % len(responses)
    return responses[response_index]

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
        if OLLAMA_AVAILABLE:
            try:
                response = ollama.chat(
                    model="llama3",  # Default model, can be configured
                    messages=messages
                )
                reply = response["message"]["content"]
            except Exception as ollama_error:
                reply = f"I'm sorry, I'm having trouble connecting to my AI service right now. Error: {str(ollama_error)}"
        else:
            # Enhanced demo mode with intelligent responses
            reply = generate_intelligent_demo_response(chat_message.message, chat_message.username, memory.get("history", []))
        
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
        if OLLAMA_AVAILABLE:
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
        else:
            reply = f"I received your image and the message: '{message}'. In a full setup with Ollama, I would analyze this image using the LLaVA model and provide detailed insights about what I see."
        
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
        if OLLAMA_AVAILABLE:
            try:
                response = ollama.generate(
                    model="sdxl",
                    prompt=prompt
                )
                reply = f"Generated an image with prompt: {prompt}"
            except Exception as ollama_error:
                reply = f"I'm having trouble generating images right now. Error: {str(ollama_error)}"
        else:
            reply = f"I would generate an image with the prompt: '{prompt}'. In a full setup with Ollama and SDXL model, this would create an actual image based on your description."
        
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
    # Try to test Ollama connection directly
    import httpx

    ollama_hosts = [
        "http://localhost:11434",
        "http://127.0.0.1:11434",
        "http://0.0.0.0:11434"
    ]

    for host in ollama_hosts:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{host}/api/version", timeout=2.0)
                if response.status_code == 200:
                    # Try to get models
                    models_response = await client.get(f"{host}/api/tags", timeout=5.0)
                    models = []
                    if models_response.status_code == 200:
                        models_data = models_response.json()
                        models = [model["name"] for model in models_data.get("models", [])]

                    return JSONResponse({
                        "status": "healthy",
                        "ollama_available": True,
                        "ollama_host": host,
                        "models": models,
                        "version": response.json() if response.status_code == 200 else "unknown"
                    })
        except Exception as e:
            continue

    # If Ollama Python package is available, try that
    if OLLAMA_AVAILABLE:
        try:
            models = ollama.list()
            return JSONResponse({
                "status": "healthy",
                "ollama_available": True,
                "connection_method": "python_package",
                "models": [model["name"] for model in models.get("models", [])]
            })
        except Exception as e:
            return JSONResponse({
                "status": "degraded",
                "ollama_available": False,
                "python_package_error": str(e),
                "suggestion": "Try running 'ollama serve' in terminal"
            })

    return JSONResponse({
        "status": "demo",
        "ollama_available": False,
        "message": "Ollama not running or not accessible",
        "suggestion": "Run 'ollama serve' to start Ollama service"
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
