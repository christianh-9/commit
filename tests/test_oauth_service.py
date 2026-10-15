import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import OAuthAccount, User
from app.services.oauth import OAuthError, get_or_create_oauth_user


async def google_login(
    db: AsyncSession,
    *,
    sub: str = "google-123",
    email: str = "new@example.com",
    verified: bool = True,
    name: str | None = "New Person",
) -> tuple[User, bool]:
    return await get_or_create_oauth_user(
        db,
        provider="google",
        provider_user_id=sub,
        email=email,
        email_verified=verified,
        name=name,
    )


async def count(db: AsyncSession, model: type[User] | type[OAuthAccount]) -> int:
    return await db.scalar(select(func.count()).select_from(model)) or 0


async def test_first_login_creates_user_and_link(db: AsyncSession) -> None:
    user, created = await google_login(db)
    assert created is True
    assert user.email == "new@example.com"
    assert user.password_hash is None
    assert user.display_name == "New Person"
    assert await count(db, OAuthAccount) == 1


async def test_returning_user_gets_same_account(db: AsyncSession) -> None:
    first, _ = await google_login(db)
    second, created = await google_login(db)
    assert created is False
    assert second.id == first.id
    assert await count(db, User) == 1


async def test_matches_on_google_id_even_if_email_changed(db: AsyncSession) -> None:
    first, _ = await google_login(db, email="old@example.com")
    second, created = await google_login(db, email="changed@example.com")
    assert created is False
    assert second.id == first.id


async def test_unverified_email_is_rejected(db: AsyncSession) -> None:
    with pytest.raises(OAuthError):
        await google_login(db, verified=False)
    assert await count(db, User) == 0


async def test_existing_password_account_is_not_linked(db: AsyncSession) -> None:
    db.add(
        User(
            email="taken@example.com",
            password_hash="not-a-real-hash",
            display_name="Taken",
            target_days_per_week=3,
        )
    )
    await db.commit()

    with pytest.raises(OAuthError):
        await google_login(db, email="Taken@Example.com")
    assert await count(db, OAuthAccount) == 0


async def test_display_name_is_trimmed_or_falls_back_to_email(db: AsyncSession) -> None:
    long_name, _ = await google_login(db, name="A" * 80)
    assert len(long_name.display_name) == 50

    no_name, _ = await google_login(
        db, sub="google-456", email="lifter@example.com", name=None
    )
    assert no_name.display_name == "lifter"
