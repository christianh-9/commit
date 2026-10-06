from fastapi import FastAPI
from sqlalchemy import text

from app.api.auth import router as auth_router
from app.api.deps import DbSession

app = FastAPI(title="Commit API")
app.include_router(auth_router)


@app.get("/health")
async def health(db: DbSession) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}
