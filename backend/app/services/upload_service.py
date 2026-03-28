from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


class UploadService:
    async def save_image(self, file: UploadFile, user_id: int) -> dict:
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        extension = Path(file.filename or "image.png").suffix or ".png"
        filename = f"user-{user_id}-{uuid4().hex}{extension}"
        target = upload_dir / filename
        content = await file.read()
        target.write_bytes(content)
        relative_url = f"/{settings.upload_dir}/{filename}"
        if settings.public_asset_base_url:
            base = settings.public_asset_base_url.rstrip("/")
            return {"url": f"{base}{relative_url}"}
        return {"url": relative_url}
