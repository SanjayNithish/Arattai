from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=40)
    avatar_url: str | None = None
    bio: str | None = Field(default=None, max_length=255)
    status_message: str | None = Field(default=None, max_length=120)


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    avatar_url: str | None
    bio: str | None
    status_message: str | None
    is_online: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
