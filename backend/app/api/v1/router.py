from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as orgs_router
from app.api.v1.chatbots import router as chatbots_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.widget import router as widget_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.leads import router as leads_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.appointments import router as appointments_router
from app.api.v1.handoff import router as handoff_router
from app.api.v1.billing import router as billing_router
from app.api.v1.public import router as public_router
from app.api.v1.beta import router as beta_router
from app.api.v1.onboarding import router as onboarding_router
from app.api.v1.status import router as status_router
from app.api.v1.health import router as health_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter()

# Mount endpoints
api_router.include_router(auth_router)
api_router.include_router(orgs_router)
api_router.include_router(chatbots_router)
api_router.include_router(knowledge_router)
api_router.include_router(widget_router)
api_router.include_router(conversations_router)
api_router.include_router(leads_router)
api_router.include_router(analytics_router)
api_router.include_router(appointments_router)
api_router.include_router(integrations_router)
api_router.include_router(handoff_router)
api_router.include_router(billing_router)
api_router.include_router(public_router)
api_router.include_router(beta_router)
api_router.include_router(admin_router, prefix="/admin", tags=["Admin Health & Telemetry"])
api_router.include_router(health_router, prefix="/health", tags=["Health & Readiness"])
api_router.include_router(onboarding_router, prefix="/onboarding", tags=["Automated Onboarding & Email Sequences"])
api_router.include_router(status_router, prefix="/status", tags=["System Status & Health SLA"])
