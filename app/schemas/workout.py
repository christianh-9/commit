import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ExerciseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    muscle_group: str


class SetCreate(BaseModel):
    exercise_id: uuid.UUID
    reps: int = Field(ge=1, le=1000)
    weight: float | None = Field(default=None, ge=0, le=9999.99)


class WorkoutCreate(BaseModel):
    performed_on: date
    duration_min: int | None = Field(default=None, ge=1, le=600)
    notes: str | None = Field(default=None, max_length=2000)
    sets: list[SetCreate] = Field(min_length=1, max_length=100)


class SetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    set_number: int
    reps: int
    weight: float | None
    exercise: ExerciseRead


class WorkoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    performed_on: date
    duration_min: int | None
    notes: str | None
    created_at: datetime
    sets: list[SetRead]
