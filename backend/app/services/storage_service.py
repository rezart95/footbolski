import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.storage import storage_client


def _extension(filename: str | None) -> str:
    suffix = Path(filename or "").suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"


async def upload_player_photo(file: UploadFile, player_id: uuid.UUID | None = None) -> str:
    contents = await file.read()
    ext = _extension(file.filename)
    content_type = file.content_type or "image/jpeg"
    root = f"players/{player_id}" if player_id else f"players/uploads/{uuid.uuid4()}"
    return await storage_client.put_bytes(f"{root}/photo{ext}", contents, content_type)
