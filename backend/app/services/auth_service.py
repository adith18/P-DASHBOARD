from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.config import settings
from app.core.security import verify_password
from app.repositories.user import user_repository
from app.models.user import User
from app.schemas.user import UserCreate

class AuthService:
    def register_user(self, db: Session, user_in: UserCreate) -> User:
        """Register a new user, ensuring email uniqueness."""
        existing_user = user_repository.get_by_email(db, email=user_in.email)
        if existing_user:
            raise ValueError("A user with this email already exists.")
        return user_repository.create(db, obj_in=user_in)

    def authenticate(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate user credentials."""
        user = user_repository.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def verify_token(self, db: Session, token: str) -> Optional[User]:
        """Verify JWT and return the user."""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            user_uuid = UUID(user_id)
        except (JWTError, ValueError):
            return None
        
        return user_repository.get(db, id=user_uuid)

auth_service = AuthService()
