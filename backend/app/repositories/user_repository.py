from sqlalchemy.orm import Session
from typing import List, Tuple, Optional
from app.models.user import User


def get_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_all(db: Session, page: int = 1, page_size: int = 10) -> Tuple[List[User], int]:
    query = db.query(User)
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    return users, total


def create(db: Session, name: str, email: str, hashed_password: str, role: str) -> User:
    user = User(name=name, email=email, hashed_password=hashed_password, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user