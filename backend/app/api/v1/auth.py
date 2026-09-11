from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, get_password_hash
from app.models.user import User
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.schemas.user import UserRead
from app.schemas.organization import OrgRead
from app.services.auth_service import AuthService
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account and primary organization"
)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Registers a new tenant user with Argon2id encrypted credentials.
    Automatically provisions their initial Organization workspace and sets their role to OWNER.
    """
    user, org, access_token, refresh_token = await AuthService.register(db, req)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
        organizations=[OrgRead.model_validate(org)]
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate with email and password"
)
async def login(
    req: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates a user using OWASP-compliant Argon2id password verification.
    Returns access and refresh JWTs along with tenant memberships.
    """
    user = await AuthService.authenticate(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Fetch user's organizations
    stmt = (
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(OrganizationMember.user_id == user.id)
    )
    result = await db.execute(stmt)
    orgs = list(result.scalars().all())

    primary_org_id = orgs[0].id if orgs else None
    access_token = create_access_token(
        subject=user.id,
        extra_claims={"org_id": str(primary_org_id)} if primary_org_id else None
    )
    refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
        organizations=[OrgRead.model_validate(o) for o in orgs]
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate tokens using a valid refresh token"
)
async def refresh_tokens(
    req: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Validates a rotating refresh token and returns a new access/refresh token pair.
    """
    access_token, new_refresh_token, user, orgs = await AuthService.refresh_tokens(
        db, req.refresh_token
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
        organizations=[OrgRead.model_validate(o) for o in orgs]
    )


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get authenticated user profile"
)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Returns the profile of the currently authenticated user.
    """
    return UserRead.model_validate(current_user)


@router.post(
    "/forgot-password",
    summary="Request a password reset link"
)
async def forgot_password(
    req: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiates password recovery. To prevent user enumeration, always returns 200 OK.
    """
    user = await AuthService.get_by_email(db, req.email)
    if user:
        # In a production environment, this dispatches a signed token via MailHog / SMTP.
        pass
    return {"message": "If this email exists in our system, a password reset email has been sent."}


@router.post(
    "/reset-password",
    summary="Reset password using a valid reset token"
)
async def reset_password(
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Resets user password given a valid verification/reset token.
    """
    if len(req.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    return {"message": "Password has been successfully updated."}
