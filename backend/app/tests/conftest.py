import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole

TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    db = TestingSessionLocal()
    db.execute(text("DELETE FROM tasks"))
    db.execute(text("DELETE FROM projects"))
    db.execute(text("DELETE FROM users"))
    db.commit()
    db.close()


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def admin_user(db):
    user = User(
        name="Admin User",
        email="admin@test.com",
        hashed_password=get_password_hash("adminpass"),
        role=UserRole.admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def dev_user(db):
    user = User(
        name="Dev User",
        email="dev@test.com",
        hashed_password=get_password_hash("devpass"),
        role=UserRole.developer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    resp = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "adminpass"})
    return resp.json()["access_token"]


@pytest.fixture
def dev_token(client, dev_user):
    resp = client.post("/api/auth/login", json={"email": "dev@test.com", "password": "devpass"})
    return resp.json()["access_token"]