from datetime import date

from pydantic import BaseModel


class HeapmapDay(BaseModel):
    day: date
    count: int


class StreakStats(BaseModel):
    current_streak: int
    best_streak: int
    days_this_week: int
    target_days_per_week: int
