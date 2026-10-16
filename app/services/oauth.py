from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import OAuthAccount, User


class OAuthError(Exception):
    """A sign-in problem"""


async def get_or_create_oauth_user(
    db: AsyncSession,
    *,
    provider: str,
    provider_user_id: str,
    email: str,
    email_verified: bool,
    name: str | None,
) -> tuple[User, bool]:

    if not email_verified:
        raise OAuthError("Your Google email address isn't verified.")

    linked_user = await db.scalar(
        select(User)
        .join(OAuthAccount, OAuthAccount.user_id == User.id)
        .where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == provider_user_id,
        )
    )
    if linked_user is not None:
        return linked_user, False

    email = email.lower()
    existing = await db.scalar(select(User).where(User.email == email))

    if existing is not None:
        # Safe because the email is verified above: Google vouches the person owns it.
        db.add(
            OAuthAccount(
                user_id=existing.id,
                provider=provider,
                provider_user_id=provider_user_id,
            )
        )
        await db.commit()
        return existing, False

    display_name = (name or email.split("@")[0]).strip()[:50] or "Lifter"
    user = User(
        email=email,
        password_hash=None,
        display_name=display_name,
        target_days_per_week=3,
    )

    db.add(user)
    await db.flush()

    db.add(
        OAuthAccount(
            user_id=user.id, provider=provider, provider_user_id=provider_user_id
        )
    )
    await db.commit()
    return user, True
