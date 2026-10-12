from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Query
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession
from app.models import User, Workout
from app.schemas.stats import HeapmapDay, StreakStats
from app.services.streaks import compute_streaks

router = APIRouter(prefix="/stats", tags=["stats"])


def user_today(user: User) -> date:
    return datetime.now(ZoneInfo(user.timezone)).date()


@router.get("/heatmap", response_model=list[HeapmapDay])
async def heatmap(
    user: CurrentUser, db: DbSession, days: int = Query(default=365, ge=7, le=730)
) -> list[HeapmapDay]:
    start = user_today(user) - timedelta(days=days - 1)
    stmt = (
        select(Workout.performed_on, func.count(Workout.id))
        .where(Workout.user_id == user.id, Workout.performed_on >= start)
        .group_by(Workout.performed_on)
        .order_by(Workout.performed_on)
    )
    result = await db.execute(stmt)
    return [HeapmapDay(day=day, count=count) for day, count in result.all()]


@router.get("/streak", response_model=StreakStats)
async def streak(user: CurrentUser, db: DbSession) -> StreakStats:
    result = await db.scalars(
        select(Workout.performed_on).where(Workout.user_id == user.id).distinct()
    )
    return compute_streaks(
        set(result.all()), user.target_days_per_week, user_today(user)
    )
