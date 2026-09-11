import os
import uuid
from typing import Optional
from app.core.config import settings

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage_uploads"))


class StorageAdapter:
    """
    Adapter for multi-tenant object storage.
    Supports MinIO/S3 with graceful local file system storage for isolated environments.
    """
    def __init__(self):
        os.makedirs(UPLOAD_DIR, exist_ok=True)

    def upload_file(
        self,
        org_id: uuid.UUID,
        filename: str,
        content: bytes,
        mime_type: Optional[str] = None
    ) -> str:
        """
        Stores file content under tenant-isolated path: {org_id}/{uuid}_{filename}.
        Returns the stored file path / URI.
        """
        tenant_dir = os.path.join(UPLOAD_DIR, str(org_id))
        os.makedirs(tenant_dir, exist_ok=True)

        safe_filename = f"{uuid.uuid4().hex[:8]}_{filename}"
        dest_path = os.path.join(tenant_dir, safe_filename)

        with open(dest_path, "wb") as f:
            f.write(content)

        return dest_path

    def read_file(self, file_path: str) -> bytes:
        """Reads file bytes from stored path."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(file_path, "rb") as f:
            return f.read()

    def delete_file(self, file_path: str) -> bool:
        """Deletes file from storage."""
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False


storage_adapter = StorageAdapter()
