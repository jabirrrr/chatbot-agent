import sys
import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-entrypoint")

# Add backend directory to sys.path so app.* modules can be imported seamlessly
current_file = Path(__file__).resolve()
backend_dir = current_file.parent.parent / "backend"
root_dir = current_file.parent.parent

for p in [str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app
    logger.info("Successfully imported FastAPI app instance from app.main")
except Exception as exc:
    logger.error(f"Failed to import app.main in serverless entrypoint: {exc}", exc_info=True)
    raise

