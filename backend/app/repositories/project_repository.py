from sqlalchemy.orm import Session
from typing import List, Tuple, Optional
from app.models.project import Project


def get_by_id(db: Session, project_id: int) -> Optional[Project]:
    return db.query(Project).filter(Project.id == project_id).first()


def get_all(db: Session, page: int = 1, page_size: int = 10) -> Tuple[List[Project], int]:
    query = db.query(Project)
    total = query.count()
    projects = query.offset((page - 1) * page_size).limit(page_size).all()
    return projects, total


def create(db: Session, name: str, description: Optional[str], created_by: int) -> Project:
    project = Project(name=name, description=description, created_by=created_by)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update(db: Session, project: Project, **kwargs) -> Project:
    for field, value in kwargs.items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


def delete(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()