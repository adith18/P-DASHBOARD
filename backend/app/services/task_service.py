from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Tuple, Optional

from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskAssign, TaskStatusUpdate
import app.repositories.task_repository as task_repository
import app.repositories.project_repository as project_repository
import app.repositories.user_repository as user_repository


def get_task(db: Session, task_id: int) -> Task:
    task = task_repository.get_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def get_tasks(
    db: Session,
    project_id: Optional[int],
    status: Optional[TaskStatus],
    assigned_to: Optional[int],
    page: int,
    page_size: int,
) -> Tuple[List[Task], int]:
    return task_repository.get_all(
        db,
        project_id=project_id,
        status=status,
        assigned_to=assigned_to,
        page=page,
        page_size=page_size
    )


def create_task(db: Session, task_in: TaskCreate, current_user: User) -> Task:
    if not project_repository.get_by_id(db, task_in.project_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if task_in.assigned_to and not user_repository.get_by_id(db, task_in.assigned_to):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")
    return task_repository.create(db, **task_in.model_dump())


def assign_task(db: Session, task_id: int, assign_in: TaskAssign, current_user: User) -> Task:
    task = get_task(db, task_id)
    if not user_repository.get_by_id(db, assign_in.assigned_to):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return task_repository.update(db, task, assigned_to=assign_in.assigned_to)


def update_task_status(db: Session, task_id: int, status_in: TaskStatusUpdate, current_user: User) -> Task:
    task = get_task(db, task_id)
    if current_user.role != "admin" and task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin or assignee can update status"
        )
    return task_repository.update(db, task, status=status_in.status)


def update_task(db: Session, task_id: int, task_in: TaskUpdate, current_user: User) -> Task:
    task = get_task(db, task_id)
    updates = task_in.model_dump(exclude_unset=True)
    return task_repository.update(db, task, **updates)