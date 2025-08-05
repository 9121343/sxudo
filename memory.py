import os
import json
from threading import Lock

MEMORY_FILE = "sxudo_memory.json"
MAX_HISTORY = 5  # Reduced for better performance
memory_lock = Lock()

def load_memory(username="default"):
    with memory_lock:
        if not os.path.exists(MEMORY_FILE):
            # Create initial memory structure
            return {
                "username": username,
                "history": [],
                "first_interaction": True
            }
            
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                all_memory = json.load(f)
            return all_memory.get(username, {
                "username": username,
                "history": [],
                "first_interaction": True
            })
        except:
            return {
                "username": username,
                "history": [],
                "first_interaction": True
            }

def save_memory(username, memory):
    with memory_lock:
        all_memory = {}
        if os.path.exists(MEMORY_FILE):
            try:
                with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                    all_memory = json.load(f)
            except:
                pass
        
        # Ensure we don't save too much history
        if "history" in memory and len(memory["history"]) > MAX_HISTORY:
            memory["history"] = memory["history"][-MAX_HISTORY:]
        
        # Add first interaction flag if missing
        if "first_interaction" not in memory:
            memory["first_interaction"] = False
        
        all_memory[username] = memory
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(all_memory, f, indent=4)