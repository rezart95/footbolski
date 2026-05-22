from fastapi import APIRouter, UploadFile

from app.services import storage_service

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/player-photo")
async def upload_player_photo(file: UploadFile):
    return {"url": await storage_service.upload_player_photo(file)}
