from datetime import date

from app.services.streaks import compute_streaks, week_start

TODAY = date(2026, 10, 14)


def days(*isos: str) -> set[date]:
    return {date.fromisoformat(s) for s in isos}


def test_week_start_is_monday() -> None:
    assert week_start(date(2026, 10, 14)) == date(2026, 10, 12)
    assert week_start(date(2026, 10, 12)) == date(2026, 10, 12)
    assert week_start(date(2026, 10, 18)) == date(2026, 10, 12)


def test_no_workouts() -> None:
    stats = compute_streaks(set(), target=3, today=TODAY)

    assert stats.current_streak == 0
    assert stats.best_streak == 0
    assert stats.days_this_week == 0


def test_week_in_progress_does_not_break_streak() -> None:
    workouts = days("2026-10-06", "2026-10-08", "2026-10-12")
    stats = compute_streaks(workouts, target=2, today=TODAY)
    assert stats.current_streak == 1
    assert stats.days_this_week == 1


def test_current_week_counts_once_target_met() -> None:
    workouts = days("2026-10-06", "2026-10-08", "2026-10-12", "2026-10-13")
    stats = compute_streaks(workouts, target=2, today=TODAY)
    assert stats.current_streak == 2


def test_missed_week_breaks_streak() -> None:
    workouts = days("2026-09-22", "2026-10-06")
    stats = compute_streaks(workouts, target=1, today=TODAY)
    assert stats.best_streak == 1
    assert stats.current_streak == 1


def test_best_streak_survives_a_break() -> None:
    workouts = days("2026-09-08", "2026-09-15", "2026-09-22", "2026-10-06")
    stats = compute_streaks(workouts, target=1, today=TODAY)
    assert stats.best_streak == 3
    assert stats.current_streak == 1


def test_sunday_and_monday_are_different_weeks() -> None:
    workouts = days("2026-10-11", "2026-10-12")
    stats = compute_streaks(workouts, target=2, today=TODAY)
    assert stats.current_streak == 0
    assert stats.days_this_week == 1
