from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import delete_me
from app.models import Exercise, OAuthAccount, User, Workout, WorkoutSet


async def count(db: AsyncSession, model: type) -> int:
    return await db.scalar(select(func.count()).select_from(model)) or 0


def make_user(email: str) -> User:
    return User(
        email=email, password_hash=None, display_name="Lifter", target_days_per_week=3
    )


async def test_deleting_account_removes_everything_it_owns(db: AsyncSession) -> None:
    squat = Exercise(name="Squat", muscle_group="legs")
    me, other = make_user("me@example.com"), make_user("other@example.com")
    db.add_all([squat, me, other])
    await db.flush()
    for owner in (me, other):
        db.add(
            Workout(
                user_id=owner.id,
                performed_on=date(2026, 11, 2),
                sets=[
                    WorkoutSet(exercise_id=squat.id, set_number=1, reps=5, weight=100)
                ],
            )
        )
    db.add(OAuthAccount(user_id=me.id, provider="google", provider_user_id="g-1"))
    await db.commit()

    await delete_me(user=me, db=db)

    assert await db.get(User, me.id) is None
    assert await count(db, OAuthAccount) == 0
    assert await count(db, User) == 1
    assert await count(db, Workout) == 1
    assert await count(db, WorkoutSet) == 1
    assert await count(db, Exercise) == 1
