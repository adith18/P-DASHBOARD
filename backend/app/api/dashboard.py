from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.api.deps import get_db, get_current_user
from app.models.project import Project
from app.models.task import Task
from app.models.user import User

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve dashboard summary analytics for the logged-in user."""
    # 1. Projects user is associated with (admins see all projects)
    if current_user.role == "admin":
        user_projects = db.query(Project).all()
    else:
        user_projects = (
            db.query(Project)
            .filter((Project.created_by == current_user.id) | (Project.members.any(User.id == current_user.id)))
            .all()
        )
        
    project_ids = [p.id for p in user_projects]
    
    # Project status counts
    project_status_counts = {"Not Started": 0, "In Progress": 0, "Completed": 0, "Suspended": 0}
    for p in user_projects:
        status = p.status
        if status in project_status_counts:
            project_status_counts[status] += 1
        else:
            project_status_counts[status] = 1

    # 2. Tasks inside those projects
    tasks = []
    if project_ids:
        tasks = db.query(Task).filter(Task.project_id.in_(project_ids)).all()
        
    task_status_counts = {"Todo": 0, "In Progress": 0, "Review": 0, "Done": 0}
    task_priority_counts = {"Low": 0, "Medium": 0, "High": 0}
    
    for t in tasks:
        # Status
        status = t.status
        if status in task_status_counts:
            task_status_counts[status] += 1
        else:
            task_status_counts[status] = 1
            
        # Priority
        priority = t.priority
        if priority in task_priority_counts:
            task_priority_counts[priority] += 1
        else:
            task_priority_counts[priority] = 1

    # 3. Tasks specifically assigned to current user
    assigned_tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
    
    # Upcoming tasks (due in next 7 days, and not Done)
    today = date.today()
    next_week = today + timedelta(days=7)
    upcoming_tasks = []
    overdue_count = 0
    
    for t in assigned_tasks:
        if t.status != "Done" and t.due_date:
            if t.due_date < today:
                overdue_count += 1
            elif today <= t.due_date <= next_week:
                upcoming_tasks.append(t)

    # Sort upcoming tasks by due date
    upcoming_tasks.sort(key=lambda x: x.due_date if x.due_date else date.max)

    # Format upcoming tasks as JSON schemas
    upcoming_tasks_schema = []
    for t in upcoming_tasks[:5]:  # Limit to top 5
        upcoming_tasks_schema.append({
            "id": str(t.id),
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "project_id": str(t.project_id)
        })

    # Summary response payload
    return {
        "project_count": len(user_projects),
        "project_status_counts": project_status_counts,
        "task_count": len(tasks),
        "task_status_counts": task_status_counts,
        "task_priority_counts": task_priority_counts,
        "assigned_task_count": len(assigned_tasks),
        "overdue_task_count": overdue_count,
        "upcoming_tasks": upcoming_tasks_schema
    }
