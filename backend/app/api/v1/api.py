
from fastapi import APIRouter
from app.api.v1.endpoints import auth

api_router = APIRouter()
api_router.include_router(auth.router)
# Future: api_router.include_router(scans.router)
# Future: api_router.include_router(projects.router)
