import uuid
from datetime import datetime
from typing import Annotated
from zoneinfo import available_timezones

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

VALID_TIMEZONES = available_timezones()


def check_timezone(value: str) -> str:
    if value not in VALID_TIMEZONES:
        raise ValueError("Unknown timezone")
    return value


Timezone = Annotated[str, AfterValidator(check_timezone)]


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=50)
    target_days_per_week: int = Field(ge=1, le=7)
    timezone: Timezone = "America/Los_Angeles"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str
    timezone: str
    target_days_per_week: int
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=50)
    target_days_per_week: int | None = Field(default=None, ge=1, le=7)
    timezone: Timezone | None = None
