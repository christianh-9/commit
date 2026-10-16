from urllib.parse import urlencode

from authlib.integrations.starlette_client import OAuthError as AuthLibError
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

from app.api.deps import DbSession
from app.core.config import settings
from app.core.oauth import oauth
from app.core.security import create_access_token
from app.services.oauth import OAuthError, get_or_create_oauth_user

router = APIRouter(prefix="/auth/google", tags=["auth"])


def frontend_redirect(path: str, **params: str) -> RedirectResponse:
    url = f"{settings.frontend_url}{path}"
    if params:
        url += "#" + urlencode(params)

    return RedirectResponse(url, status_code=302)


@router.get("/login")
async def google_login(request: Request) -> RedirectResponse:
    return await oauth.google.authorize_redirect(request, settings.google_redirect_url)


@router.get("/callback")
async def google_calback(request: Request, db: DbSession) -> RedirectResponse:
    if request.query_params.get("error"):
        return frontend_redirect("/login", error="Google sign-in was cancelled.")

    try:
        token = await oauth.google.authorize_access_token(request)
    except AuthLibError:
        return frontend_redirect(
            "/login", error="Google sign in failed. Please try again."
        )

    info = token.get("userinfo")
    if not info:
        return frontend_redirect(
            "/login", error="Google didn't send your account details"
        )

    try:
        user, created = await get_or_create_oauth_user(
            db,
            provider="google",
            provider_user_id=info["sub"],
            email=info["email"],
            email_verified=bool(info.get("email_verified")),
            name=info.get("name"),
        )
    except OAuthError as exc:
        return frontend_redirect("/login", error=str(exc))

    params = {"token": create_access_token(str(user.id))}
    if created:
        params["new"] = "1"
    return frontend_redirect("/auth/callback", **params)
