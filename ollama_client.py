import requests
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "sxudo")

def query_ollama(message: str) -> str:
    response = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={"model": MODEL_NAME, "prompt": message}
    )
    response.raise_for_status()
    return response.json().get("response", "")
