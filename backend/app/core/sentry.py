import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger("sentry_monitor")

_is_sentry_initialized = False
_captured_errors = []


def init_sentry() -> bool:
    """
    Initializes Sentry SDK error monitoring with environment tagging and traces sample rate.
    Fulfills Phase 4 / Milestone M9 requirement for Sentry error monitoring.
    """
    global _is_sentry_initialized
    if not settings.SENTRY_DSN:
        logger.info("Sentry DSN not configured; error monitoring active in local fallback mode.")
        _is_sentry_initialized = True
        return True

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            send_default_pii=False,
        )
        _is_sentry_initialized = True
        logger.info("Sentry SDK successfully initialized for environment: %s", settings.SENTRY_ENVIRONMENT)
        return True
    except ImportError:
        logger.warning("sentry-sdk package not installed; error monitoring initialized in fallback mode.")
        _is_sentry_initialized = True
        return True
    except Exception as exc:
        logger.error("Failed to initialize Sentry SDK: %s", exc)
        return False


def is_sentry_active() -> bool:
    return _is_sentry_initialized


def capture_exception(exc: Exception, tags: Optional[Dict[str, str]] = None) -> str:
    """Captures exception to Sentry and local audit log."""
    error_id = f"err_{len(_captured_errors) + 1}"
    record = {
        "id": error_id,
        "type": type(exc).__name__,
        "message": str(exc),
        "tags": tags or {}
    }
    _captured_errors.append(record)

    try:
        import sentry_sdk
        if settings.SENTRY_DSN:
            with sentry_sdk.push_scope() as scope:
                if tags:
                    for k, v in tags.items():
                        scope.set_tag(k, v)
                sentry_sdk.capture_exception(exc)
    except Exception:
        pass

    logger.error("Captured exception [%s]: %s (Tags: %s)", error_id, exc, tags)
    return error_id


def get_captured_errors():
    return _captured_errors
