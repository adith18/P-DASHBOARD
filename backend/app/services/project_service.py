from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Tuple

from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate
import app.repositories.project_repository as project_repository


def get_project(db: Session, project_id: int) -> Project:
    project = project_repository.get_by_id(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def get_projects(db: Session, page: int, page_size: int) -> Tuple[List[Project], int]:
    return project_repository.get_all(db, page, page_size)


def create_project(db: Session, project_in: ProjectCreate, current_user: User) -> Project:
    return project_repository.create(
        db,
        name=project_in.name,
        description=project_in.description,
        created_by=current_user.id
    )


def update_project(db: Session, project_id: int, project_in: ProjectUpdate, current_user: User) -> Project:
    project = get_project(db, project_id)
    if current_user.role != "admin" and project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    updates = project_in.model_dump(exclude_unset=True)
    return project_repository.update(db, project, **updates)


def delete_project(db: Session, project_id: int, current_user: User) -> None:
    project = get_project(db, project_id)
    if current_user.role != "admin" and project.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    project_repository.delete(db, project)