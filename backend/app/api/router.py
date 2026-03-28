from fastapi import APIRouter

from app.api.routes import auth, conversations, uploads, users, websocket

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
api_router.include_router(websocket.router, tags=["websocket"])
