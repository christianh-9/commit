from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.workouts import update_workout
from app.models import Exercise, User, Workout, WorkoutSet
from app.schemas.workout import SetCreate, WorkoutCreate

TZ = "America/Los_Angeles"


def today() -> date:
    return datetime.now(ZoneInfo(TZ)).date()


def make_user(email: str) -> User:
    return User(
        email=email,
        password_hash=None,
        display_name="Lifter",
        target_days_per_week=3,
        timezone=TZ,
    )


async def setup(db: AsyncSession) -> tuple[User, Workout, Exercise]:
    squat = Exercise(name="Squat", muscle_group="legs")
    bench = Exercise(name="Bench Press", muscle_group="chest")
    owner = make_user("owner@example.com")
    db.add_all([squat, bench, owner])
    await db.flush()

    workout = Workout(
        user_id=owner.id,
        performed_on=today() - timedelta(days=3),
        notes="old notes",
        sets=[
            WorkoutSet(exercise_id=squat.id, set_number=n, reps=5, weight=100)
            for n in (1, 2, 3)
        ],
    )
    db.add(workout)
    await db.commit()
    return owner, workout, bench


def edit(exercise: Exercise, performed_on: date) -> WorkoutCreate:
    return WorkoutCreate(
        performed_on=performed_on,
        duration_min=40,
        notes="new notes",
        sets=[
            SetCreate(exercise_id=exercise.id, reps=8, weight=60),
            SetCreate(exercise_id=exercise.id, reps=6, weight=65),
        ],
    )


async def test_edit_replaces_fields_and_sets(db: AsyncSession) -> None:
    owner, workout, bench = await setup(db)
    new_day = today() - timedelta(days=1)

    updated = await update_workout(
        workout_id=workout.id, data=edit(bench, new_day), user=owner, db=db
    )

    assert updated.performed_on == new_day
    assert updated.duration_min == 40
    assert updated.notes == "new notes"
    assert [(s.set_number, s.exercise.name, s.reps) for s in updated.sets] == [
        (1, "Bench Press", 8),
        (2, "Bench Press", 6),
    ]
    assert await db.scalar(select(func.count()).select_from(WorkoutSet)) == 2


async def test_cannot_edit_someone_elses_workout(db: AsyncSession) -> None:
    _, workout, bench = await setup(db)
    intruder = make_user("intruder@example.com")
    db.add(intruder)
    await db.commit()

    with pytest.raises(HTTPException) as exc:
        await update_workout(
            workout_id=workout.id,
            data=edit(bench, today()),
            user=intruder,
            db=db,
        )
    assert exc.value.status_code == 404


async def test_cannot_move_workout_to_the_future(db: AsyncSession) -> None:
    owner, workout, bench = await setup(db)

    with pytest.raises(HTTPException) as exc:
        await update_workout(
            workout_id=workout.id,
            data=edit(bench, today() + timedelta(days=2)),
            user=owner,
            db=db,
        )
    assert exc.value.status_code == 422
