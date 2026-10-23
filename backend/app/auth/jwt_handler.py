import logging
from typing import Dict, Any, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import auth as firebase_auth
from app.database.connection import db
import bcrypt
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "smart_pharmacy_secret_key"
ALGORITHM = "HS256"

logger = logging.getLogger("AuthHandler")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_local_token(token: str) -> Optional[dict]:
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_token
    except Exception as e:
        logger.info(f"Local JWT verification failed, trying Firebase: {str(e)}")
        try:
            # Fallback to Firebase Auth ID token verification
            return firebase_auth.verify_id_token(token)
        except Exception as fe:
            logger.error(f"Firebase verification fallback failed: {str(fe)}")
            return None

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials: Token invalid or expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    decoded_token = verify_local_token(token)
    if decoded_token is None:
        raise credentials_exception
        
    email: str = decoded_token.get("sub") or decoded_token.get("email")
    if email is None:
        raise credentials_exception
        
    users = db.query("users", "email", "==", email)
    if not users:
        # Handle case where user is verified but has no profile document
        logger.warning(f"Authenticated user {email} has no Firestore user profile. Creating default...")
        user_id = decoded_token.get("uid") or f"usr_{email.split('@')[0]}"
        user_doc = {
            "user_id": user_id,
            "name": decoded_token.get("name", email.split('@')[0]),
            "email": email,
            "role": "admin" if "admin" in email else "manager" if "manager" in email else "pharmacist",
            "created_at": datetime.now().isoformat()
        }
        db.create("users", user_id, user_doc)
        return user_doc
        
    return users[0]

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of roles {self.allowed_roles}. Current role: {user_role}",
            )
        return current_user

# Helpers and cryptographic utility functions

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_byte_enc = plain_password.encode('utf-8')
        hashed_password_byte_enc = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
