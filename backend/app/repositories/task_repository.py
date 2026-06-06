from sqlalchemy.orm import Session
from typing import List, Tuple, Optional
from app.models.task import Task, TaskStatus


def get_by_id(db: Session, task_id: int) -> Optional[Task]:
    return db.query(Task).filter(Task.id == task_id).first()


def get_all(
    db: Session,
    project_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    assigned_to: Optional[int] = None,
    page: int = 1,
    page_size: int = 10,
) -> Tuple[List[Task], int]:
    query = db.query(Task)
    if project_id is not None:
        query = query.filter(Task.project_id == project_id)
    if status is not None:
        query = query.filter(Task.status == status)
    if assigned_to is not None:
        query = query.filter(Task.assigned_to == assigned_to)
    total = query.count()
    tasks = query.offset((page - 1) * page_size).limit(page_size).all()
    return tasks, total


def create(db: Session, **kwargs) -> Task:
    task = Task(**kwargs)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update(db: Session, task: Task, **kwargs) -> Task:
    for field, value in kwargs.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task