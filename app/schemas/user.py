import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=50)
    target_days_per_week: int = Field(ge=1, le=7)
    timezone: str = "America/Los_Angeles"


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
