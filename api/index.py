import sys
import os

# Cache bust: Deploy Admin API routes (Commit 26a73b2)
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
    import traceback
    logger.error(f"Failed to import app.main in serverless entrypoint: {exc}", exc_info=True)
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    
    app = FastAPI(title="Error Fallback")
    startup_trace = traceback.format_exc()

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    async def fallback_route(full_path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Serverless FastAPI initialization failed",
                "message": str(exc),
                "traceback": startup_trace
            }
        )

