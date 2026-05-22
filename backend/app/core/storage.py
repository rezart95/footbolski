from io import BytesIO

from app.core.config import get_settings


class StorageClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client = None

    async def client(self):
        if self._client is None:
            from miniopy_async import Minio

            self._client = Minio(
                self.settings.minio_endpoint,
                access_key=self.settings.minio_access_key,
                secret_key=self.settings.minio_secret_key,
                secure=False,
            )
        return self._client

    async def ensure_bucket(self) -> None:
        client = await self.client()
        exists = await client.bucket_exists(self.settings.minio_bucket)
        if not exists:
            await client.make_bucket(self.settings.minio_bucket)

    async def put_bytes(self, path: str, data: bytes, content_type: str) -> str:
        await self.ensure_bucket()
        client = await self.client()
        await client.put_object(
            self.settings.minio_bucket,
            path,
            BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return f"{self.settings.minio_public_url}/{self.settings.minio_bucket}/{path}"


storage_client = StorageClient()
