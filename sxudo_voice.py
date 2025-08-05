import speech_recognition as sr
import requests
import asyncio
import edge_tts  # pip install edge-tts

# 🎤 Step 1: Listen to your voice
def listen():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("🎤 Speak:")
        audio = r.listen(source)
    try:
        return r.recognize_google(audio)
    except sr.UnknownValueError:
        return "Sorry, I couldn't understand you."
    except sr.RequestError:
        return "API unavailable or no internet."

# 🤖 Step 2: Send prompt to SXUDO via Ollama API
def send_to_ollama(prompt, model="sxudo:latest"):
    response = requests.post("http://127.0.0.1:11434/api/generate", json={
        "model": model,
        "prompt": prompt,
        "stream": False
    })
    data = response.json()
    print("🔍 Raw response:", data)
    return data.get("response", "No response received.")

# 🔊 Step 3: Make SXUDO speak using Edge TTS
async def speak(text, voice="en-US-GuyNeural"):
    communicate = edge_tts.Communicate(text, voice=voice, rate="+5%")
    await communicate.play()

# 🧠 Main logic
if __name__ == "__main__":
    text = listen()
    print("🗣️ You said:", text)

    reply = send_to_ollama(text)
    print("🤖 SXUDO says:", reply)

    asyncio.run(speak(reply))  # Speak the reply
