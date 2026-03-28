from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.db.session import init_db
from app.websocket.manager import websocket_manager


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    await websocket_manager.reset_presence()
    yield


app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

app.include_router(api_router, prefix=settings.api_v1_prefix)
app.mount(f"/{settings.upload_dir}", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health", tags=["health"])
async def healthcheck():
    return {"status": "ok"}
