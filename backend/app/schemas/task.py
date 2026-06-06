from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum
from app.schemas.user import UserResponse


class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.todo
    project_id: int
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None


class TaskAssign(BaseModel):
    assigned_to: int


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatus
    project_id: int
    assigned_to: Optional[int] = None
    due_date: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    assignee: Optional[UserResponse] = None

    model_config = {"from_attributes": True}