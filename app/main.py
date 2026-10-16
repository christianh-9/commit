from fastapi import FastAPI
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware

from app.api.auth import router as auth_router
from app.api.deps import DbSession
from app.api.oauth import router as oauth_router
from app.api.stats import router as stats_router
from app.api.workouts import router as workouts_router
from app.core.config import settings

app = FastAPI(title="Commit API")

app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)
app.include_router(auth_router)
app.include_router(oauth_router)
app.include_router(workouts_router)
app.include_router(stats_router)


@app.get("/health")
async def health(db: DbSession) -> dict[str, str]:
    await db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}
