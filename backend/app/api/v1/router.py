from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as orgs_router
from app.api.v1.chatbots import router as chatbots_router
from app.api.v1.knowledge import router as knowledge_router

api_router = APIRouter()

# Mount endpoints
api_router.include_router(auth_router)
api_router.include_router(orgs_router)
api_router.include_router(chatbots_router)
api_router.include_router(knowledge_router)
