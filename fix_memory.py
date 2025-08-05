import json
import os
from datetime import datetime

MEMORY_FILE = "sxudo_memory.json"
BACKUP_FILE = "sxudo_memory_backup.json"

def run_once():
    if not os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE, "w") as f:
            json.dump({"username": "default", "history": []}, f, indent=2)
        return

    try:
        with open(MEMORY_FILE, "r") as f:
            data = json.load(f)

        if isinstance(data, dict) and "history" not in data:
            print("⚠️ Fixing malformed sxudo_memory.json...")

            # Backup original
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = BACKUP_FILE.replace(".json", f"_{timestamp}.json")
            with open(backup_path, "w") as backup:
                json.dump(data, backup, indent=2)

            # Rewrite as valid memory
            fixed_data = {"username": "default", "history": [{"user": k, "sxudo": v} for k, v in data.items()]}
            with open(MEMORY_FILE, "w") as f:
                json.dump(fixed_data, f, indent=2)

            print(f"✅ Fixed memory file. Backup saved as: {backup_path}")
    except Exception as e:
        print(f"❌ Error reading or fixing memory file: {e}")
