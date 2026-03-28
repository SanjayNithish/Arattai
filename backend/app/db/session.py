from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.database_url, future=True, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    import app.db.base  # noqa: F401

    if not settings.auto_init_db:
        return

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(
            text(
                """
                ALTER TABLE conversation_members
                ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE conversations
                ADD COLUMN IF NOT EXISTS description VARCHAR(500)
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE messages
                ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'user'
                """
            )
        )
        await conn.execute(
            text(
                """
                ALTER TABLE messages
                ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE
                """
            )
        )
