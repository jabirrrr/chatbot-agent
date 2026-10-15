from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class SystemLogEntry(BaseModel):
    id: str = Field(..., description="Unique event identifier (UUID)")
    timestamp: datetime = Field(..., description="UTC timestamp of the log event")
    level: str = Field(..., description="Log severity level: INFO, WARNING, ERROR, CRITICAL")
    source: str = Field(..., description="Subsystem source: API, AUTH, DATABASE, WORKER, SYSTEM")
    message: str = Field(..., description="Sanitized human-readable log summary")
    user_id: Optional[str] = Field(None, description="Associated user ID or subject")
    request_path: Optional[str] = Field(None, description="HTTP request path when relevant")
    status_code: Optional[int] = Field(None, description="HTTP status code when relevant")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Sanitized allowlisted metadata")
    instance_id: Optional[str] = Field(None, description="Process instance ID that originated the event")

class SystemLogHistoryResponse(BaseModel):
    logs: List[SystemLogEntry] = Field(..., description="List of historical log entries in descending order")
    total_available: int = Field(..., description="Total entries currently in the in-memory ring buffer")
    redis_connected: bool = Field(..., description="Whether Redis Pub/Sub is active for multi-instance sync")
    is_process_local_only: bool = Field(..., description="True if operating in degraded mode without cross-instance sync")
    storage_notice: str = Field(..., description="Explanation of log retention and storage limitations")
