from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.user import Token, UserCreate, UserRead, UserUpdate

router = APIRouter(tags=["auth"])


@router.post(
    "/auth/register", response_model=UserRead, status_code=status.HTTP_201_CREATED
)
async def register(data: UserCreate, db: DbSession) -> User:
    email = data.email.lower()
    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(data.password),
        display_name=data.display_name,
        timezone=data.timezone,
        target_days_per_week=data.target_days_per_week,
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/auth/login", response_model=Token)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession
) -> Token:
    user = await db.scalar(select(User).where(User.email == form.username.lower()))
    if user is None or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return Token(access_token=create_access_token(str(user.id)))


@router.get("/users/me", response_model=UserRead)
async def read_me(user: CurrentUser) -> User:
    return user


@router.patch("/users/me", response_model=UserRead)
async def update_me(data: UserUpdate, user: CurrentUser, db: DbSession) -> User:
    changes = data.model_dump(exclude_unset=True, exclude_none=True)
    for field, value in changes.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user
