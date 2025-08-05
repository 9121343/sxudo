import ollama
from memory import load_memory, save_memory

SESSION_ID = "default"

def ask_ollama(prompt: str) -> str:
    history = load_memory(SESSION_ID)
    history.append({"role": "user", "content": prompt})

    try:
        response = ollama.chat(
            model="sxudo",  # your Ollama model name
            messages=history
        )
        reply = response["message"]["content"]
        history.append({"role": "assistant", "content": reply})
        save_memory(SESSION_ID, history)
        return reply
    except Exception as e:
        return f"Error: {str(e)}"
