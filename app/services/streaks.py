from datetime import date, timedelta

from app.schemas.stats import StreakStats


def week_start(day: date) -> date:
    return day - timedelta(days=day.weekday())


def compute_streaks(workout_days: set[date], target: int, today: date) -> StreakStats:
    days_per_week: dict[date, int] = {}

    for day in workout_days:
        monday = week_start(day)
        days_per_week[monday] = days_per_week.get(monday, 0) + 1

    one_week = timedelta(weeks=1)
    current_week = week_start(today)
    days_this_week = days_per_week.get(current_week, 0)

    current = 0
    week = current_week - one_week
    while days_per_week.get(week, 0) >= target:
        current += 1
        week -= one_week

    if days_this_week >= target:
        current += 1

    best, run = 0, 0

    if days_per_week:
        week = min(days_per_week)
        while week <= current_week:
            if days_per_week.get(week, 0) >= target:
                run += 1
                best = max(best, run)

            else:
                run = 0

            week += one_week
    return StreakStats(
        current_streak=current,
        best_streak=best,
        days_this_week=days_this_week,
        target_days_per_week=target,
    )
