import asyncio
import json
import logging
import re
import sys
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional, Set

from fastapi import HTTPException, status
from app.core.config import settings
from app.schemas.system_log import SystemLogEntry, SystemLogHistoryResponse

logger = logging.getLogger("helio-log-bus")

# 1. Allowlisted metadata keys & sensitive patterns
ALLOWLISTED_METADATA_KEYS = {
    "user_id", "email", "ip_address", "client_ip", "path", "method",
    "status_code", "duration_ms", "component", "action", "target_user_id",
    "target_email", "changes", "reason", "worker_id", "event_type",
    "error_type", "status", "role", "organization_id", "details"
}

SENSITIVE_KEY_PATTERNS = {
    "password", "passwd", "hashed_password", "token", "access_token", "refresh_token",
    "secret", "api_key", "apikey", "cookie", "cookies", "authorization", "auth",
    "prompt", "prompts", "messages", "content", "query", "body", "input", "output",
    "credential", "credentials", "session", "session_id", "private_key"
}

# Regex scrubbers for string data
CONN_STRING_REGEX = re.compile(
    r'(postgresql|postgres|redis|rediss|mysql|mongodb|amqp|http|https)://[^@\s]+@',
    re.IGNORECASE
)
BEARER_REGEX = re.compile(r'Bearer\s+[A-Za-z0-9\-_.~+/]+=*', re.IGNORECASE)
JWT_REGEX = re.compile(r'ey[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*')
KV_SECRET_REGEX = re.compile(
    r'(?i)(password|passwd|secret|token|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|session)\s*[:=]\s*["\']?[^\s"\'&,]+["\']?'
)

def sanitize_string(val: str) -> str:
    """Scrub database passwords, bearer tokens, JWTs, and key=value secrets."""
    if not val:
        return ""
    text = str(val)
    text = CONN_STRING_REGEX.sub(r'\1://***@', text)
    text = BEARER_REGEX.sub('Bearer ***', text)
    text = JWT_REGEX.sub('[REDACTED_JWT]', text)
    text = KV_SECRET_REGEX.sub(r'\1=***', text)
    if len(text) > 500:
        return text[:497] + "..."
    return text

def sanitize_metadata(data: Any, depth: int = 0) -> Any:
    """
    Recursively sanitize all dictionary/list fields.
    At root level (depth=0), enforces allowlisted metadata keys.
    Under any depth, rejects sensitive keys and applies string scrubbers.
    """
    if depth > 5:
        return "[TRUNCATED_DEPTH]"
    
    if isinstance(data, dict):
        sanitized_dict: Dict[str, Any] = {}
        for k, v in data.items():
            k_str = str(k).lower().strip()
            # Strip any sensitive key completely
            if any(p in k_str for p in SENSITIVE_KEY_PATTERNS):
                continue
            # Enforce allowlisted root fields
            if depth == 0 and k_str not in ALLOWLISTED_METADATA_KEYS:
                continue
            sanitized_dict[str(k)] = sanitize_metadata(v, depth + 1)
        return sanitized_dict
    elif isinstance(data, (list, tuple, set)):
        return [sanitize_metadata(item, depth + 1) for item in list(data)[:20]]
    elif isinstance(data, str):
        return sanitize_string(data)
    elif isinstance(data, (int, float, bool)) or data is None:
        return data
    else:
        return sanitize_string(str(data))


class LogEventBus:
    """
    In-memory broadcast event bus for live administrative system logs.
    Features:
    - Bounded in-memory ring buffer (500 events)
    - Non-blocking synchronous emit() with recursive sanitization
    - Anti-recursion protection preventing log loops if logging fails
    - Redis Pub/Sub for horizontal multi-instance streaming with graceful fallback
    - Subscriber queue backpressure and 10 concurrent super_user connection cap
    """

    MAX_HISTORY = 500
    MAX_SUBSCRIBERS = 10
    REDIS_CHANNEL = "helio:system_logs"

    def __init__(self):
        self._history: deque[SystemLogEntry] = deque(maxlen=self.MAX_HISTORY)
        self._subscribers: Set[asyncio.Queue] = set()
        self._instance_id: str = uuid.uuid4().hex[:8]
        self._is_emitting: bool = False
        self.redis_client = None
        self.redis_connected: bool = False
        self._redis_task: Optional[asyncio.Task] = None
        self._shutdown_event = asyncio.Event()

    @property
    def instance_id(self) -> str:
        return self._instance_id

    async def initialize(self) -> None:
        """Initialize Redis Pub/Sub listener if configured."""
        redis_url = getattr(settings, "REDIS_URL", None)
        if not redis_url or redis_url in ("", "none", "disabled"):
            self.redis_connected = False
            return

        try:
            import redis.asyncio as aioredis
            self.redis_client = aioredis.from_url(
                redis_url,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0
            )
            # Verify connectivity
            await self.redis_client.ping()
            self.redis_connected = True
            self._shutdown_event.clear()
            self._redis_task = asyncio.create_task(self._listen_redis())
            logger.info("Live log Redis Pub/Sub integration initialized successfully.")
        except Exception as exc:
            self.redis_connected = False
            logger.warning(f"Live log Redis Pub/Sub unavailable ({sanitize_string(str(exc))}). Operating in process-local mode.")

    async def _listen_redis(self) -> None:
        """Background task listening for cross-instance logs via Redis Pub/Sub."""
        pubsub = None
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe(self.REDIS_CHANNEL)
            while not self._shutdown_event.is_set():
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message and message.get("type") == "message":
                        raw_data = message.get("data")
                        if isinstance(raw_data, str):
                            entry_dict = json.loads(raw_data)
                            entry = SystemLogEntry(**entry_dict)
                            # Ignore events published by this exact process
                            if entry.instance_id == self._instance_id:
                                continue
                            self._append_and_broadcast(entry, publish_redis=False)
                except asyncio.CancelledError:
                    break
                except Exception as exc:
                    self.redis_connected = False
                    await asyncio.sleep(2.0)
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            self.redis_connected = False
        finally:
            if pubsub:
                try:
                    await pubsub.unsubscribe(self.REDIS_CHANNEL)
                    await pubsub.close()
                except Exception:
                    pass

    async def shutdown(self) -> None:
        """Gracefully terminate background tasks and close Redis connection."""
        self._shutdown_event.set()
        if self._redis_task:
            self._redis_task.cancel()
            try:
                await self._redis_task
            except asyncio.CancelledError:
                pass
            self._redis_task = None

        if self.redis_client:
            try:
                await self.redis_client.close()
            except Exception:
                pass
            self.redis_client = None
        self.redis_connected = False

    def emit(
        self,
        source: str,
        level: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        request_path: Optional[str] = None,
        status_code: Optional[int] = None
    ) -> None:
        """
        Synchronously emit a log event.
        - Non-blocking
        - Anti-recursion guarded
        - Recursively sanitizes all inputs
        - Broadcasts to local subscribers and publishes to Redis
        """
        if self._is_emitting:
            return  # Prevent recursive logging loops

        self._is_emitting = True
        try:
            sanitized_msg = sanitize_string(message)
            sanitized_meta = sanitize_metadata(metadata or {}, depth=0)
            sanitized_user_id = sanitize_string(user_id) if user_id else None
            sanitized_path = sanitize_string(request_path) if request_path else None

            # Validate severity & source
            norm_level = level.upper() if level else "INFO"
            if norm_level not in {"INFO", "WARNING", "ERROR", "CRITICAL"}:
                norm_level = "INFO"

            norm_source = source.upper() if source else "SYSTEM"
            if norm_source not in {"API", "AUTH", "DATABASE", "WORKER", "SYSTEM"}:
                norm_source = "SYSTEM"

            entry = SystemLogEntry(
                id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                level=norm_level,
                source=norm_source,
                message=sanitized_msg,
                user_id=sanitized_user_id,
                request_path=sanitized_path,
                status_code=status_code,
                metadata=sanitized_meta,
                instance_id=self._instance_id
            )

            self._append_and_broadcast(entry, publish_redis=True)
        except Exception as exc:
            # Under no circumstances should an emit failure bubble up or trigger logger recursion
            try:
                sys.stderr.write(f"[LogEventBus.emit error] {str(exc)}\n")
            except Exception:
                pass
        finally:
            self._is_emitting = False

    def _append_and_broadcast(self, entry: SystemLogEntry, publish_redis: bool = True) -> None:
        """Appends entry to local ring buffer and delivers to active client queues."""
        self._history.append(entry)

        # Broadcast to local subscribers
        dead_subscribers = set()
        for q in list(self._subscribers):
            try:
                q.put_nowait(entry)
            except asyncio.QueueFull:
                # Drop oldest item to prevent blocking or memory ballooning
                try:
                    q.get_nowait()
                    q.put_nowait(entry)
                except Exception:
                    dead_subscribers.add(q)
            except Exception:
                dead_subscribers.add(q)

        for dead in dead_subscribers:
            self._subscribers.discard(dead)

        # Publish to Redis if connected and requested
        if publish_redis and self.redis_connected and self.redis_client:
            try:
                loop = asyncio.get_running_loop()
                if loop.is_running():
                    loop.create_task(self._safe_redis_publish(entry))
            except RuntimeError:
                pass  # No running event loop in current thread

    async def _safe_redis_publish(self, entry: SystemLogEntry) -> None:
        """Publish entry to Redis channel with exception isolation."""
        if not self.redis_client:
            return
        try:
            payload = entry.model_dump_json()
            await self.redis_client.publish(self.REDIS_CHANNEL, payload)
        except Exception:
            # Mark disconnected without recursive logging
            self.redis_connected = False

    def subscribe(self) -> asyncio.Queue:
        """Register a new SSE client queue, enforcing concurrent limits."""
        if len(self._subscribers) >= self.MAX_SUBSCRIBERS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Concurrent live log stream limit reached ({self.MAX_SUBSCRIBERS} active clients)."
            )
        q: asyncio.Queue = asyncio.Queue(maxsize=200)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        """Cleanly remove a client queue upon disconnection."""
        self._subscribers.discard(q)

    def get_subscriber_count(self) -> int:
        return len(self._subscribers)

    def get_history(
        self,
        limit: int = 100,
        level: Optional[str] = None,
        source: Optional[str] = None,
        search: Optional[str] = None
    ) -> SystemLogHistoryResponse:
        """Retrieve recent entries from in-memory ring buffer with filtering."""
        limit = max(1, min(limit, self.MAX_HISTORY))
        filtered: List[SystemLogEntry] = []

        level_filter = level.upper() if level else None
        source_filter = source.upper() if source else None
        search_filter = search.lower() if search else None

        # Iterate in reverse chronological order
        for entry in reversed(self._history):
            if level_filter and entry.level != level_filter:
                continue
            if source_filter and entry.source != source_filter:
                continue
            if search_filter:
                match_msg = search_filter in entry.message.lower()
                match_path = entry.request_path and search_filter in entry.request_path.lower()
                match_user = entry.user_id and search_filter in entry.user_id.lower()
                if not (match_msg or match_path or match_user):
                    continue

            filtered.append(entry)
            if len(filtered) >= limit:
                break

        notice = (
            "Process-local in-memory buffer (capped at 500 events). Historical logs are not persisted to database. Cross-instance live stream relies on Redis Pub/Sub."
            if self.redis_connected
            else "Process-local in-memory buffer (capped at 500 events). DEGRADED MODE: Redis Pub/Sub is unavailable. Stream reflects only this worker process and logs are not synchronized across replicas."
        )

        return SystemLogHistoryResponse(
            logs=filtered,
            total_available=len(self._history),
            redis_connected=self.redis_connected,
            is_process_local_only=not self.redis_connected,
            storage_notice=notice
        )

# Global singleton
log_bus = LogEventBus()
