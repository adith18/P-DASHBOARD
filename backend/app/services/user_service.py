from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Tuple

from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password
import app.repositories.user_repository as user_repository


def get_user_by_id(db: Session, user_id: int) -> User:
    user = user_repository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_users(db: Session, page: int, page_size: int) -> Tuple[List[User], int]:
    return user_repository.get_all(db, page, page_size)


def create_user(db: Session, user_in: UserCreate) -> User:
    if user_repository.get_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed = get_password_hash(user_in.password)
    return user_repository.create(
        db,
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed,
        role=user_in.role
    )


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = user_repository.get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    return user