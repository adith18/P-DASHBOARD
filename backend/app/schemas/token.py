from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list