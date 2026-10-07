"""seed exercises

Revision ID: 4776985ea01a
Revises: 37fcfde8736d
"""

import uuid
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4776985ea01a"
down_revision: str | Sequence[str] | None = "37fcfde8736d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

EXERCISES = [
    ("Bench Press", "chest"),
    ("Incline Bench Press", "chest"),
    ("Dumbbell Bench Press", "chest"),
    ("Incline Dumbbell Press", "chest"),
    ("Chest Fly", "chest"),
    ("Push-Up", "chest"),
    ("Dip", "chest"),
    ("Deadlift", "back"),
    ("Barbell Row", "back"),
    ("Dumbbell Row", "back"),
    ("Pull-Up", "back"),
    ("Chin-Up", "back"),
    ("Lat Pulldown", "back"),
    ("Seated Cable Row", "back"),
    ("Back Squat", "legs"),
    ("Front Squat", "legs"),
    ("Romanian Deadlift", "legs"),
    ("Leg Press", "legs"),
    ("Lunge", "legs"),
    ("Leg Extension", "legs"),
    ("Leg Curl", "legs"),
    ("Hip Thrust", "legs"),
    ("Calf Raise", "legs"),
    ("Overhead Press", "shoulders"),
    ("Dumbbell Shoulder Press", "shoulders"),
    ("Lateral Raise", "shoulders"),
    ("Face Pull", "shoulders"),
    ("Barbell Curl", "arms"),
    ("Dumbbell Curl", "arms"),
    ("Hammer Curl", "arms"),
    ("Tricep Pushdown", "arms"),
    ("Skull Crusher", "arms"),
    ("Hanging Leg Raise", "core"),
    ("Cable Crunch", "core"),
]

exercises_table = sa.table(
    "exercises",
    sa.column("id", sa.Uuid),
    sa.column("name", sa.String),
    sa.column("muscle_group", sa.String),
)


def upgrade() -> None:
    op.bulk_insert(
        exercises_table,
        [
            {"id": uuid.uuid4(), "name": name, "muscle_group": group}
            for name, group in EXERCISES
        ],
    )


def downgrade() -> None:
    names = [name for name, _ in EXERCISES]
    op.execute(exercises_table.delete().where(exercises_table.c.name.in_(names)))
