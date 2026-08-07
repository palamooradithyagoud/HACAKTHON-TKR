import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from supabase import create_client
from backend.config import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # "student" | "faculty"
    department: Optional[str] = ""
    section: Optional[str] = ""
    academic_year: Optional[str] = ""
    college: str = "TKR College of Engineering & Technology"


def get_admin_client():
    """Returns a Supabase admin client using the service_role key (bypasses RLS)."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase admin client not configured."
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


@router.post("/register")
async def admin_register(body: RegisterRequest):
    """
    Admin registration endpoint.
    Uses Supabase service_role key to create a user with email already confirmed —
    no email verification required. Ideal for hackathon/demo environments.
    """
    clean_email = body.email.strip().lower()

    admin = get_admin_client()

    # Create user via Admin API — email_confirm=True skips email verification
    try:
        res = admin.auth.admin.create_user({
            "email": clean_email,
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": body.full_name,
                "role": body.role,
                "department": body.department,
                "section": body.section,
                "college": body.college,
            }
        })
    except Exception as e:
        err_msg = str(e).lower()
        if "already registered" in err_msg or "already been registered" in err_msg or "unique" in err_msg or "duplicate" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please sign in instead."
            )
        logger.error(f"Admin create_user failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

    user = res.user
    if not user or not user.id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User creation returned no user object."
        )

    real_user_id = str(user.id)

    # Upsert academic profile into Supabase
    academic_payload = {
        "user_id": real_user_id,
        "full_name": body.full_name,
        "college": body.college,
        "department": body.department or ("CSM" if body.role == "student" else "Faculty"),
        "section": body.section or ("Section A" if body.role == "student" else ""),
        "academic_year": body.academic_year or "2nd Year",
        "target_role": "Software Engineer" if body.role == "student" else "Faculty",
        "attendance_percentage": 0.0,
        "coding_score": 0,
    }
    try:
        admin.from_("user_academic_profile").upsert(academic_payload, on_conflict="user_id").execute()
        logger.info(f"Academic profile saved for {real_user_id} ({body.role})")
    except Exception as e:
        logger.warning(f"Could not save academic profile for {real_user_id}: {e}")

    # Sign in immediately to get a session token for the client
    try:
        sign_in_res = admin.auth.sign_in_with_password({
            "email": clean_email,
            "password": body.password,
        })
        session = sign_in_res.session
        access_token = session.access_token if session else None
    except Exception as e:
        logger.warning(f"Auto sign-in after admin create failed: {e}")
        access_token = None

    return {
        "success": True,
        "user_id": real_user_id,
        "email": clean_email,
        "full_name": body.full_name,
        "role": body.role,
        "access_token": access_token,
        "message": f"Account created successfully for {body.full_name}."
    }
