from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    GroupDiscoveryResponse,
    MessageCreate,
    MessageResponse,
    MessageUpdate,
    TypingEvent,
)
from app.services.chat_service import ChatService

router = APIRouter()


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).list_conversations(current_user.id)


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).create_conversation(current_user.id, payload)


@router.put("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    payload: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).update_conversation(current_user.id, conversation_id, payload)


@router.get("/discover/groups", response_model=list[GroupDiscoveryResponse])
async def discover_groups(
    query: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).discover_groups(current_user.id, query or "")


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).list_messages(current_user.id, conversation_id)


@router.post("/{conversation_id}/messages", response_model=MessageResponse)
async def create_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.conversation_id != conversation_id:
        raise HTTPException(status_code=400, detail="Conversation mismatch")
    return await ChatService(db).create_message(current_user.id, payload)


@router.put("/{conversation_id}/messages/{message_id}", response_model=MessageResponse)
async def update_message(
    conversation_id: int,
    message_id: int,
    payload: MessageUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService(db).update_message(current_user.id, conversation_id, message_id, payload)


@router.delete("/{conversation_id}/messages/{message_id}")
async def delete_message(
    conversation_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ChatService(db).delete_message(current_user.id, conversation_id, message_id)
    return {"ok": True}


@router.post("/{conversation_id}/typing")
async def typing(
    conversation_id: int,
    payload: TypingEvent,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.conversation_id != conversation_id:
        raise HTTPException(status_code=400, detail="Conversation mismatch")
    await ChatService(db).emit_typing(current_user, payload)
    return {"ok": True}


@router.post("/{conversation_id}/members/{user_id}")
async def add_member(
    conversation_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ChatService(db).add_group_member(current_user.id, conversation_id, user_id)
    return {"ok": True}


@router.post("/{conversation_id}/join")
async def join_group(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ChatService(db).join_group(current_user.id, conversation_id)
    return {"ok": True}


@router.delete("/{conversation_id}/members/{user_id}")
async def remove_member(
    conversation_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ChatService(db).remove_group_member(current_user.id, conversation_id, user_id)
    return {"ok": True}


@router.post("/{conversation_id}/leave")
async def leave_group(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ChatService(db).leave_group(current_user.id, conversation_id)
    return {"ok": True}


@router.delete("/{conversation_id}")
async def delete_chat(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ChatService(db).delete_chat_for_user(current_user.id, conversation_id)
    return {"ok": True}
