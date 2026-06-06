export type UserRole = "admin" | "developer";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  creator?: User;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  project_id: number;
  assigned_to?: number;
  due_date?: string;
  created_at: string;
  assignee?: User;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}