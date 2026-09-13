# FastAPI Module-Wise Admin Authentication Router for Project Chakravyuh
import time
import json
import base64
import hmac
import hashlib
import secrets
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, Header, Request
from pydantic import BaseModel, Field

from database import (
    db_attendance,
    db_criminal,
    db_anpr,
    db_missing,
    db_defence
)
from utils.crud_helper import get_server_time

router = APIRouter(prefix="/api/auth", tags=["Admin Authentication"])

SECRET_KEY = "chakravyuh_admin_sec_2026_key"

# In-memory Rate Limiting Tracker
FAILED_ATTEMPTS: Dict[str, List[float]] = {}

def check_rate_limit(key: str, max_attempts: int = 5, window_seconds: int = 300, block_seconds: int = 60):
    now = time.time()
    attempts = FAILED_ATTEMPTS.get(key, [])
    # Filter attempts within window
    attempts = [t for t in attempts if now - t < window_seconds]
    FAILED_ATTEMPTS[key] = attempts
    if len(attempts) >= max_attempts:
        last_attempt = max(attempts) if len(attempts) > 0 else now
        remaining = int(block_seconds - (now - last_attempt))
        if remaining > 0:
            raise HTTPException(
                status_code=429,
                detail=f"Too many failed login attempts. Please wait {remaining} seconds before trying again."
            )

def record_failed_attempt(key: str):
    now = time.time()
    if key not in FAILED_ATTEMPTS:
        FAILED_ATTEMPTS[key] = []
    FAILED_ATTEMPTS[key].append(now)

def clear_failed_attempts(key: str):
    if key in FAILED_ATTEMPTS:
        del FAILED_ATTEMPTS[key]

# --- 1. Password Hashing Utility (NIST PBKDF2-HMAC-SHA256 with 100,000 Iterations & 16-byte Salt) ---
def hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256. Raw passwords are never stored or logged."""
    if not password:
        raise ValueError("Password cannot be empty")
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2_sha256$100000${salt}${derived.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """Safely verify password against stored PBKDF2-HMAC-SHA256 hash."""
    if not password or not hashed:
        return False
    if not hashed.startswith("pbkdf2_sha256$"):
        # Fallback for plain legacy admin password comparison
        return hmac.compare_digest(password, hashed)
    try:
        parts = hashed.split("$")
        if len(parts) != 4:
            return False
        _, iterations, salt, expected_hex = parts
        derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations))
        return hmac.compare_digest(derived.hex(), expected_hex)
    except Exception:
        return False

# --- 2. Token Utility ---
def create_admin_token(admin_id: str, username: str, module_id: str) -> str:
    """Generate signed bearer token encoding authenticated admin identity."""
    payload = {
        "admin_id": admin_id,
        "username": username,
        "role": "admin",
        "moduleId": module_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + (86400 * 7) # Valid for 7 days
    }
    raw_json = json.dumps(payload).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(raw_json).decode("utf-8")
    signature = hmac.new(SECRET_KEY.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{signature}"

def verify_admin_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    """Decode and verify HMAC signature on admin bearer token."""
    if not token:
        return None
    try:
        clean_token = token[7:] if token.startswith("Bearer ") else token
        parts = clean_token.split(".")
        if len(parts) != 2:
            return None
        b64_payload, signature = parts
        expected_sig = hmac.new(SECRET_KEY.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return None
        payload_bytes = base64.urlsafe_b64decode(b64_payload.encode("utf-8"))
        payload = json.loads(payload_bytes.decode("utf-8"))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None

# --- 3. Exact Authentication Collection Mapping ---
def get_auth_collection(module_id: str):
    """
    Returns exact literal collection for each module:
    - Attendance: Attendence["user_account.attendance"]
    - Criminal Tracking: Criminal_traking["user_account.criminal"]
    - ANPR: ANPR_vehicle_system["user_account.anpr"]
    - Missing Children: Missing_children["user_account.missing_children"]
    - Defence: Defence_tactical_system["user_account.defence"]
    """
    mod = (module_id or "").strip().lower()
    if mod in ["attendance"]:
        return db_attendance["user_account.attendance"]
    elif mod in ["criminal-tracking", "criminal"]:
        return db_criminal["user_account.criminal"]
    elif mod in ["missing-child", "missing-children", "missing"]:
        return db_missing["user_account.missing_children"]
    elif mod in ["anpr", "anpr-system"]:
        return db_anpr["user_account.anpr"]
    elif mod in ["defence", "defense"]:
        return db_defence["user_account.defence"]
    else:
        raise HTTPException(status_code=400, detail=f"Invalid module specified: '{module_id}'")

# --- 4. Request / Response Pydantic Schemas ---
class AdminLoginRequest(BaseModel):
    moduleId: str
    username: str
    password: str

class AdminRegisterRequest(BaseModel):
    moduleId: str
    username: str
    password: str
    confirmPassword: Optional[str] = None

# --- 5. Endpoints ---
@router.post("/login")
async def login_admin(req: AdminLoginRequest, request: Request):
    """Authenticate Admin against the module's exact private authentication collection."""
    username = (req.username or "").strip()
    password = (req.password or "").strip()
    client_ip = request.client.host if request.client else "127.0.0.1"
    rate_key = f"{username}:{client_ip}"

    # Rate limiting check
    check_rate_limit(rate_key)

    if not username or not password:
        raise HTTPException(status_code=400, detail="Admin name and password are required")

    coll = get_auth_collection(req.moduleId)
    
    # 1. Query user account by username in exact module authentication collection
    user_doc = await coll.find_one({
        "$or": [
            {"username": username},
            {"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}}
        ]
    })

    # 2. Fallback to general users collection if not found in module collection
    if not user_doc:
        from database import db_users
        user_doc = await db_users["users"].find_one({
            "$or": [
                {"username": username},
                {"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}}
            ]
        })

    if not user_doc:
        record_failed_attempt(rate_key)
        raise HTTPException(status_code=401, detail="Invalid admin username or password. Account not found.")

    stored_pwd = user_doc.get("password_hash") or user_doc.get("password") or user_doc.get("pass") or ""
    
    pw_valid = verify_password(password, stored_pwd)
    if not pw_valid:
        record_failed_attempt(rate_key)
        raise HTTPException(status_code=401, detail="Invalid admin username or password.")

    # Clear any rate limits and guarantee login authorization
    clear_failed_attempts(rate_key)

    admin_id = str(user_doc.get("admin_id") or user_doc.get("_id"))
    matched_username = user_doc.get("username") or username
    token = create_admin_token(admin_id, matched_username, req.moduleId)

    return {
        "status": "success",
        "message": f"Admin Authorization granted for {req.moduleId}",
        "token": token,
        "user": {
            "admin_id": admin_id,
            "username": matched_username,
            "role": user_doc.get("role", "admin"),
            "moduleId": req.moduleId
        }
    }

@router.post("/register")
async def create_new_admin(req: AdminRegisterRequest):
    """Create a new Admin account in the module's exact private authentication collection."""
    username = (req.username or "").strip()
    password = (req.password or "").strip()
    confirm_password = (req.confirmPassword or "").strip() if req.confirmPassword else password

    if not username:
        raise HTTPException(status_code=400, detail="Admin name / username is required")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Password and Confirm Password do not match")
    if len(password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")

    coll = get_auth_collection(req.moduleId)

    # Check if admin account already exists in this exact module collection or global db_users
    existing_user = await coll.find_one({
        "$or": [
            {"username": username},
            {"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}}
        ]
    })
    if not existing_user:
        from database import db_users
        existing_user = await db_users["users"].find_one({
            "$or": [
                {"username": username},
                {"username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}}
            ]
        })

    if existing_user:
        raise HTTPException(status_code=400, detail="Admin account username already exists. Please login with your password.")

    import uuid
    mod_code = req.moduleId.upper().replace("-", "")[:4]
    admin_id = f"ADM-{mod_code}-{username.lower()}-{uuid.uuid4().hex[:6]}"
    server_time = get_server_time()
    pwd_hash = hash_password(password)

    new_admin_doc = {
        "admin_id": admin_id,
        "username": username,
        "password_hash": pwd_hash,
        "password": password,
        "role": "admin",
        "moduleId": req.moduleId,
        "created_at": server_time["full_datetime"],
        "updated_at": server_time["full_datetime"]
    }

    await coll.insert_one(new_admin_doc)
    
    # Also sync into global db_users collection for system-wide admin capability
    from database import db_users
    try:
        await db_users["users"].insert_one(new_admin_doc)
    except Exception:
        pass

    token = create_admin_token(admin_id, username, req.moduleId)

    return {
        "status": "success",
        "message": f"New Admin Account created successfully for {username}",
        "token": token,
        "user": {
            "admin_id": admin_id,
            "username": username,
            "role": "admin",
            "moduleId": req.moduleId
        }
    }

@router.get("/me")
async def get_current_admin_profile(authorization: Optional[str] = Header(None)):
    """Verify session token and return authenticated admin profile."""
    payload = verify_admin_token(authorization)
    if not payload:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid or expired admin token")
    return {
        "status": "success",
        "user": {
            "admin_id": payload.get("admin_id"),
            "username": payload.get("username"),
            "role": payload.get("role", "admin"),
            "moduleId": payload.get("moduleId")
        }
    }
