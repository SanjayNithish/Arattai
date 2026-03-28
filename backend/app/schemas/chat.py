from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


class ConversationTypeSchema(StrEnum):
    DIRECT = "direct"
    GROUP = "group"


class ConversationCreate(BaseModel):
    type: ConversationTypeSchema
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    member_ids: list[int]
    avatar_url: str | None = None


class ConversationUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    member_ids: list[int]
    avatar_url: str | None = None


class MessageCreate(BaseModel):
    conversation_id: int
    content: str | None = Field(default=None, max_length=5000)
    image_url: str | None = None


class MessageUpdate(BaseModel):
    content: str | None = Field(default=None, max_length=5000)


class TypingEvent(BaseModel):
    conversation_id: int
    is_typing: bool = True


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    content: str | None
    image_url: str | None
    message_type: str
    is_read: bool
    created_at: datetime
    edited_at: datetime | None = None
    sender: UserResponse

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: int
    type: str
    name: str | None
    avatar_url: str | None
    description: str | None
    created_by: int
    created_at: datetime
    members: list[UserResponse]
    last_message: MessageResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class GroupDiscoveryResponse(BaseModel):
    id: int
    name: str | None
    avatar_url: str | None
    created_by: int
    created_at: datetime
    member_count: int
    is_member: bool

    model_config = ConfigDict(from_attributes=True)
