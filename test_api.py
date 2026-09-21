import sys
import os
from pathlib import Path

current_file = Path(__file__).resolve()
backend_dir = current_file.parent / "backend"
root_dir = current_file.parent

for p in [str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.main import app
    print("Successfully imported app via backend.app.main")
except Exception as e:
    print(f"Error: {e}")
