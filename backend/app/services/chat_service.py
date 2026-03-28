from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.models.conversation import Conversation, ConversationMember, ConversationType
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    GroupDiscoveryResponse,
    MessageCreate,
    MessageUpdate,
    MessageResponse,
    TypingEvent,
)
from app.websocket.manager import websocket_manager


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_conversations(self, user_id: int) -> list[ConversationResponse]:
        result = await self.db.execute(
            select(Conversation)
            .join(ConversationMember)
            .where(
                and_(
                    ConversationMember.user_id == user_id,
                    ConversationMember.hidden_at.is_(None),
                )
            )
            .options(
                selectinload(Conversation.members).selectinload(ConversationMember.user),
                selectinload(Conversation.messages).selectinload(Message.sender),
            )
            .order_by(desc(Conversation.updated_at))
        )
        conversations = result.scalars().unique().all()
        return [self._serialize_conversation(conversation) for conversation in conversations]

    async def create_conversation(self, user_id: int, payload: ConversationCreate) -> ConversationResponse:
        member_ids = sorted(set(payload.member_ids + [user_id]))
        if payload.type == ConversationType.DIRECT and len(member_ids) != 2:
            raise HTTPException(status_code=400, detail="Direct chat must contain exactly two users")
        if payload.type == ConversationType.GROUP and not payload.name:
            raise HTTPException(status_code=400, detail="Group name is required")

        if payload.type == ConversationType.DIRECT:
            existing = await self._find_direct_conversation(member_ids)
            if existing:
                return self._serialize_conversation(existing)

        conversation = Conversation(
            type=ConversationType(payload.type),
            name=payload.name,
            avatar_url=payload.avatar_url,
            description=payload.description,
            created_by=user_id,
        )
        self.db.add(conversation)
        await self.db.flush()

        for member_id in member_ids:
            self.db.add(ConversationMember(conversation_id=conversation.id, user_id=member_id))

        await self.db.commit()
        refreshed = await self._get_conversation(conversation.id)
        await self._publish_to_users(
            member_ids,
            {"type": "conversation.created", "conversation": self._serialize_conversation(refreshed).model_dump(mode="json")},
        )
        return self._serialize_conversation(refreshed)

    async def discover_groups(self, user_id: int, query: str) -> list[GroupDiscoveryResponse]:
        membership_subquery = (
            select(ConversationMember.conversation_id)
            .where(ConversationMember.user_id == user_id)
            .subquery()
        )
        statement = (
            select(
                Conversation,
                func.count(ConversationMember.user_id).label("member_count"),
                Conversation.id.in_(select(membership_subquery.c.conversation_id)).label("is_member"),
            )
            .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
            .where(Conversation.type == ConversationType.GROUP)
            .group_by(Conversation.id)
            .order_by(desc(Conversation.created_at))
        )
        if query.strip():
            statement = statement.where(Conversation.name.ilike(f"%{query.strip()}%"))

        result = await self.db.execute(statement)
        return [
            GroupDiscoveryResponse(
                id=conversation.id,
                name=conversation.name,
                avatar_url=conversation.avatar_url,
                created_by=conversation.created_by,
                created_at=conversation.created_at,
                member_count=member_count,
                is_member=is_member,
            )
            for conversation, member_count, is_member in result.all()
        ]

    async def update_conversation(
        self, user_id: int, conversation_id: int, payload: ConversationUpdate
    ) -> ConversationResponse:
        conversation = await self._get_conversation(conversation_id)
        if conversation.type != ConversationType.GROUP:
            raise HTTPException(status_code=400, detail="Only groups can be edited")
        if conversation.created_by != user_id:
            raise HTTPException(status_code=403, detail="Only the admin can edit the group")

        conversation.name = payload.name
        conversation.description = payload.description
        conversation.avatar_url = payload.avatar_url
        self.db.add(conversation)

        desired_member_ids = set(payload.member_ids + [user_id])
        current_members = {member.user_id: member for member in conversation.members}

        for member_id, membership in current_members.items():
            if member_id == user_id:
                continue
            if member_id not in desired_member_ids:
                await self.db.delete(membership)
                await self.db.flush()
                await self._create_system_message(conversation_id, member_id, "left the group")

        for member_id in desired_member_ids:
            if member_id not in current_members:
                self.db.add(ConversationMember(conversation_id=conversation_id, user_id=member_id))
                await self.db.flush()
                await self._create_system_message(conversation_id, member_id, "joined the group")

        await self.db.commit()
        refreshed = await self._get_conversation(conversation_id)
        await self._publish_to_users(
            await self._get_member_ids(conversation_id),
            {"type": "conversation.updated", "conversationId": conversation_id},
        )
        return self._serialize_conversation(refreshed)

    async def list_messages(self, user_id: int, conversation_id: int) -> list[Message]:
        await self._ensure_member(user_id, conversation_id)
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .options(joinedload(Message.sender))
            .order_by(Message.created_at.asc())
        )
        return list(result.scalars().all())

    async def create_message(self, user_id: int, payload: MessageCreate) -> Message:
        await self._ensure_member(user_id, payload.conversation_id)
        if not payload.content and not payload.image_url:
            raise HTTPException(status_code=400, detail="Message content or image is required")

        message = Message(
            conversation_id=payload.conversation_id,
            sender_id=user_id,
            content=payload.content,
            image_url=payload.image_url,
            message_type="user",
        )
        self.db.add(message)
        conversation = await self.db.get(Conversation, payload.conversation_id)
        assert conversation is not None
        self.db.add(conversation)
        memberships = await self.db.execute(
            select(ConversationMember).where(ConversationMember.conversation_id == payload.conversation_id)
        )
        for membership in memberships.scalars().all():
            membership.hidden_at = None
            self.db.add(membership)
        await self.db.commit()

        result = await self.db.execute(
            select(Message).where(Message.id == message.id).options(joinedload(Message.sender))
        )
        created = result.scalar_one()
        member_ids = await self._get_member_ids(payload.conversation_id)
        await self._publish_to_users(
            member_ids,
            {
                "type": "message.created",
                "conversationId": payload.conversation_id,
                "message": self._serialize_message(created),
            },
        )
        return created

    async def update_message(
        self, user_id: int, conversation_id: int, message_id: int, payload: MessageUpdate
    ) -> MessageResponse:
        await self._ensure_member(user_id, conversation_id)
        result = await self.db.execute(
            select(Message)
            .where(and_(Message.id == message_id, Message.conversation_id == conversation_id))
            .options(joinedload(Message.sender))
        )
        message = result.scalar_one_or_none()
        if message is None:
            raise HTTPException(status_code=404, detail="Message not found")
        if message.sender_id != user_id or message.message_type != "user":
            raise HTTPException(status_code=403, detail="Only the sender can edit this message")
        message.content = payload.content
        message.edited_at = datetime.now(timezone.utc)
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message, attribute_names=["sender"])
        serialized = self._serialize_message(message)
        await self._publish_to_users(
            await self._get_member_ids(conversation_id),
            {"type": "message.updated", "conversationId": conversation_id, "message": serialized},
        )
        return MessageResponse.model_validate(message)

    async def delete_message(self, user_id: int, conversation_id: int, message_id: int):
        await self._ensure_member(user_id, conversation_id)
        result = await self.db.execute(
            select(Message).where(and_(Message.id == message_id, Message.conversation_id == conversation_id))
        )
        message = result.scalar_one_or_none()
        if message is None:
            raise HTTPException(status_code=404, detail="Message not found")
        if message.sender_id != user_id or message.message_type != "user":
            raise HTTPException(status_code=403, detail="Only the sender can delete this message")
        await self.db.delete(message)
        await self.db.commit()
        await self._publish_to_users(
            await self._get_member_ids(conversation_id),
            {"type": "message.deleted", "conversationId": conversation_id, "messageId": message_id},
        )

    async def emit_typing(self, current_user: User, payload: TypingEvent):
        await self._ensure_member(current_user.id, payload.conversation_id)
        member_ids = await self._get_member_ids(payload.conversation_id)
        await self._publish_to_users(
            member_ids,
            {
                "type": "typing",
                "conversationId": payload.conversation_id,
                "userId": current_user.id,
                "username": current_user.username,
                "isTyping": payload.is_typing,
            },
        )

    async def add_group_member(self, actor_id: int, conversation_id: int, user_id: int):
        if actor_id != user_id:
            raise HTTPException(status_code=403, detail="Users can only join groups themselves")
        await self.join_group(actor_id, conversation_id)

    async def join_group(self, user_id: int, conversation_id: int):
        conversation = await self._get_conversation(conversation_id)
        if conversation.type != ConversationType.GROUP:
            raise HTTPException(status_code=400, detail="Members can only be managed on group chats")
        existing = await self.db.execute(
            select(ConversationMember).where(
                and_(
                    ConversationMember.conversation_id == conversation_id,
                    ConversationMember.user_id == user_id,
                )
            )
        )
        membership = existing.scalar_one_or_none()
        if membership:
            membership.hidden_at = None
            self.db.add(membership)
            await self.db.commit()
            return
        self.db.add(ConversationMember(conversation_id=conversation_id, user_id=user_id))
        await self.db.commit()
        await self._create_system_message(conversation_id, user_id, "joined the group")
        await self._publish_to_users(
            await self._get_member_ids(conversation_id),
            {"type": "conversation.updated", "conversationId": conversation_id},
        )

    async def remove_group_member(self, actor_id: int, conversation_id: int, user_id: int):
        conversation = await self._get_conversation(conversation_id)
        if conversation.type != ConversationType.GROUP:
            raise HTTPException(status_code=400, detail="Members can only be managed on group chats")
        await self._ensure_member(actor_id, conversation_id)
        result = await self.db.execute(
            select(ConversationMember).where(
                and_(
                    ConversationMember.conversation_id == conversation_id,
                    ConversationMember.user_id == user_id,
                )
            )
        )
        member = result.scalar_one_or_none()
        if member:
            await self.db.delete(member)
            await self.db.commit()
            await self._publish_to_users(
                await self._get_member_ids(conversation_id),
                {"type": "conversation.updated", "conversationId": conversation_id},
            )

    async def leave_group(self, user_id: int, conversation_id: int):
        conversation = await self._get_conversation(conversation_id)
        if conversation.type != ConversationType.GROUP:
            raise HTTPException(status_code=400, detail="Only group chats can be left")
        await self._create_system_message(conversation_id, user_id, "left the group")
        await self._remove_membership(user_id, conversation_id)

    async def delete_chat_for_user(self, user_id: int, conversation_id: int):
        await self._ensure_member(user_id, conversation_id)
        result = await self.db.execute(
            select(ConversationMember).where(
                and_(
                    ConversationMember.conversation_id == conversation_id,
                    ConversationMember.user_id == user_id,
                )
            )
        )
        membership = result.scalar_one_or_none()
        if membership is None:
            raise HTTPException(status_code=404, detail="Membership not found")
        membership.hidden_at = datetime.now(timezone.utc)
        self.db.add(membership)
        await self.db.commit()

    async def _ensure_member(self, user_id: int, conversation_id: int):
        result = await self.db.execute(
            select(ConversationMember).where(
                and_(
                    ConversationMember.user_id == user_id,
                    ConversationMember.conversation_id == conversation_id,
                )
            )
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed in this conversation")

    async def _get_conversation(self, conversation_id: int) -> Conversation:
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(
                selectinload(Conversation.members).selectinload(ConversationMember.user),
                selectinload(Conversation.messages).selectinload(Message.sender),
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation

    async def _find_direct_conversation(self, member_ids: list[int]) -> Conversation | None:
        result = await self.db.execute(
            select(Conversation)
            .join(ConversationMember)
            .where(Conversation.type == ConversationType.DIRECT)
            .group_by(Conversation.id)
            .having(func.count(ConversationMember.user_id) == 2)
            .options(
                selectinload(Conversation.members).selectinload(ConversationMember.user),
                selectinload(Conversation.messages).selectinload(Message.sender),
            )
        )
        for conversation in result.scalars().unique().all():
            current_members = sorted(member.user_id for member in conversation.members)
            if current_members == member_ids:
                return conversation
        return None

    async def _get_member_ids(self, conversation_id: int) -> list[int]:
        result = await self.db.execute(
            select(ConversationMember.user_id).where(ConversationMember.conversation_id == conversation_id)
        )
        return list(result.scalars().all())

    async def _remove_membership(self, user_id: int, conversation_id: int):
        result = await self.db.execute(
            select(ConversationMember).where(
                and_(
                    ConversationMember.conversation_id == conversation_id,
                    ConversationMember.user_id == user_id,
                )
            )
        )
        membership = result.scalar_one_or_none()
        if membership is None:
            raise HTTPException(status_code=404, detail="Membership not found")

        await self.db.delete(membership)
        await self.db.flush()

        remaining_member_ids = await self._get_member_ids(conversation_id)
        if not remaining_member_ids:
            conversation = await self.db.get(Conversation, conversation_id)
            if conversation is not None:
                await self.db.delete(conversation)

        await self.db.commit()
        if remaining_member_ids:
            await self._publish_to_users(
                remaining_member_ids,
                {"type": "conversation.updated", "conversationId": conversation_id},
            )

    async def _publish_to_users(self, user_ids: list[int], payload: dict):
        await websocket_manager.send_to_users(user_ids, payload)

    def _serialize_conversation(self, conversation: Conversation) -> ConversationResponse:
        members = [member.user for member in conversation.members]
        last_message = max(conversation.messages, key=lambda item: item.created_at) if conversation.messages else None
        return ConversationResponse(
            id=conversation.id,
            type=conversation.type.value,
            name=conversation.name,
            avatar_url=conversation.avatar_url,
            description=conversation.description,
            created_by=conversation.created_by,
            created_at=conversation.created_at,
            members=members,
            last_message=last_message,
        )

    def _serialize_message(self, message: Message) -> dict:
        return {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "content": message.content,
            "image_url": message.image_url,
            "message_type": message.message_type,
            "is_read": message.is_read,
            "created_at": message.created_at.isoformat(),
            "edited_at": message.edited_at.isoformat() if message.edited_at else None,
            "sender": {
                "id": message.sender.id,
                "username": message.sender.username,
                "email": message.sender.email,
                "avatar_url": message.sender.avatar_url,
                "bio": message.sender.bio,
                "status_message": message.sender.status_message,
                "is_online": message.sender.is_online,
                "created_at": message.sender.created_at.isoformat(),
            },
        }

    async def _create_system_message(self, conversation_id: int, sender_id: int, suffix: str):
        result = await self.db.execute(select(User).where(User.id == sender_id))
        sender = result.scalar_one_or_none()
        if sender is None:
            return
        message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=f"{sender.username} {suffix}",
            message_type="system",
        )
        self.db.add(message)
        await self.db.commit()
        refreshed = await self.db.execute(
            select(Message).where(Message.id == message.id).options(joinedload(Message.sender))
        )
        created = refreshed.scalar_one()
        await self._publish_to_users(
            await self._get_member_ids(conversation_id),
            {"type": "message.created", "conversationId": conversation_id, "message": self._serialize_message(created)},
        )
