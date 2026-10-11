import uuid
from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.models import Exercise, Workout, WorkoutSet
from app.schemas.workout import ExerciseRead, WorkoutCreate, WorkoutRead

router = APIRouter(tags=["workouts"])


async def get_workout_for_suer(
    db: DbSession, workout_id: uuid.UUID, user_id: uuid.UUID
) -> Workout:
    stmt = (
        select(Workout)
        .where(Workout.id == workout_id, Workout.user_id == user_id)
        .options(selectinload(Workout.sets).selectinload(WorkoutSet.exercise))
        .execution_options(populate_existing=True)
    )
    workout = await db.scalar(stmt)
    if workout is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Workout not found")
    return workout


@router.get("/exercises", response_model=list[ExerciseRead])
async def list_exercises(db: DbSession) -> list[Exercise]:
    result = await db.scalars(
        select(Exercise).order_by(Exercise.muscle_group, Exercise.name)
    )
    return list(result.all())


@router.post(
    "/workouts", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED
)
async def create_workout(
    data: WorkoutCreate, user: CurrentUser, db: DbSession
) -> Workout:
    today = datetime.now(ZoneInfo(user.timezone)).date()
    if data.performed_on > today:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Workout date cannot be in the future",
        )
    exercise_ids = {s.exercise_id for s in data.sets}
    found = set(
        await db.scalars(select(Exercise.id).where(Exercise.id.in_(exercise_ids)))
    )
    missing = exercise_ids - found
    if missing:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Unknown exercise id(s) : {', '.join(str(m) for m in missing)}",
        )

    workout = Workout(
        user_id=user.id,
        performed_on=data.performed_on,
        duration_min=data.duration_min,
        notes=data.notes,
        sets=[
            WorkoutSet(
                exercise_id=s.exercise_id,
                set_number=i,
                reps=s.reps,
                weight=s.weight,
            )
            for i, s in enumerate(data.sets, start=1)
        ],
    )

    db.add(workout)
    await db.commit()
    return await get_workout_for_suer(db, workout.id, user.id)


@router.get("/workouts", response_model=list[WorkoutRead])
async def list_workouts(
    user: CurrentUser,
    db: DbSession,
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Workout]:
    stmt = select(Workout).where(Workout.user_id == user.id)
    if start is not None:
        stmt = stmt.where(Workout.performed_on >= start)
    if end is not None:
        stmt = stmt.where(Workout.performed_on <= end)
    stmt = (
        stmt.order_by(Workout.performed_on.desc(), Workout.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.scalars(stmt)
    return list(result.all())


@router.get("/workouts/{workout_id}", response_model=WorkoutRead)
async def get_workout(
    workout_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> Workout:
    return await get_workout_for_suer(db, workout_id, user.id)


@router.delete("/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    workout_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> None:
    workout = await get_workout_for_suer(db, workout_id, user.id)
    await db.delete(workout)
    await db.commit()
