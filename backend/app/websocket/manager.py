from fastapi import WebSocket
from sqlalchemy import update

from app.db.session import AsyncSessionLocal
from app.models.user import User


class WebSocketManager:
    def __init__(self):
        self.connections: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.connections[user_id] = websocket
        await self._set_user_online_state(user_id, True)
        await websocket.send_json({"type": "connected", "userId": user_id})
        await self.broadcast({"type": "presence", "userId": user_id, "isOnline": True})

    async def disconnect(self, user_id: int):
        self.connections.pop(user_id, None)
        await self._set_user_online_state(user_id, False)
        await self.broadcast({"type": "presence", "userId": user_id, "isOnline": False})

    async def send_to_users(self, user_ids: list[int], payload: dict):
        delivered: set[int] = set()
        for user_id in user_ids:
            if user_id in delivered:
                continue
            delivered.add(user_id)
            websocket = self.connections.get(user_id)
            if websocket is not None:
                await websocket.send_json(payload)

    async def broadcast(self, payload: dict):
        for websocket in list(self.connections.values()):
            await websocket.send_json(payload)

    async def _set_user_online_state(self, user_id: int, is_online: bool):
        async with AsyncSessionLocal() as session:
            await session.execute(update(User).where(User.id == user_id).values(is_online=is_online))
            await session.commit()

    async def reset_presence(self):
        async with AsyncSessionLocal() as session:
            await session.execute(update(User).values(is_online=False))
            await session.commit()


websocket_manager = WebSocketManager()
