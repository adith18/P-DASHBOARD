from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Any, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskAssign, TaskStatusUpdate, TaskResponse, TaskStatus
)
from app.schemas.token import PaginatedResponse
from app.services.task_service import (
    create_task, get_tasks, get_task, assign_task, update_task_status, update_task
)
from app.models.user import User

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=201)
def create_new_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return create_task(db, task_in, current_user)


@router.get("", response_model=PaginatedResponse)
def list_tasks(
    project_id: Optional[int] = Query(None),
    status: Optional[TaskStatus] = Query(None),
    assigned_to: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Any:
    tasks, total = get_tasks(
        db,
        project_id=project_id,
        status=status,
        assigned_to=assigned_to,
        page=page,
        page_size=page_size
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [TaskResponse.model_validate(t) for t in tasks]
    }


@router.get("/{task_id}", response_model=TaskResponse)
def get_single_task(
    task_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> Any:
    return get_task(db, task_id)


@router.patch("/{task_id}/assign", response_model=TaskResponse)
def assign_task_to_user(
    task_id: int,
    assign_in: TaskAssign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return assign_task(db, task_id, assign_in, current_user)


@router.patch("/{task_id}/status", response_model=TaskResponse)
def update_status(
    task_id: int,
    status_in: TaskStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return update_task_status(db, task_id, status_in, current_user)


@router.put("/{task_id}", response_model=TaskResponse)
def update_existing_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    return update_task(db, task_id, task_in, current_user)