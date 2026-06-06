"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { Task, Project, User, TaskStatus } from "@/lib/types";
import Navbar from "@/components/Navbar";

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
};

function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get("project_id");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);

  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fProjectId, setFProjectId] = useState(projectFilter || "");
  const [fAssignedTo, setFAssignedTo] = useState("");
  const [fDueDate, setFDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    api.get("/api/projects?page_size=100").then(r => setProjects(r.data.items));
    api.get("/api/users?page_size=100").then(r => setUsers(r.data.items));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [page, statusFilter, projectFilter]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "10" });
      if (projectFilter) params.set("project_id", projectFilter);
      if (statusFilter) params.set("status", statusFilter);
      const { data } = await api.get(`/api/tasks?${params}`);
      setTasks(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/api/tasks", {
        title: fTitle,
        description: fDesc || undefined,
        project_id: Number(fProjectId),
        assigned_to: fAssignedTo ? Number(fAssignedTo) : undefined,
        due_date: fDueDate || undefined,
      });
      setShowModal(false);
      setFTitle("");
      setFDesc("");
      setFDueDate("");
      setFAssignedTo("");
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error creating task");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(taskId: number, status: TaskStatus) {
    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status });
      fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Not allowed");
    }
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Tasks {projectFilter ? `(Project #${projectFilter})` : ""}
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + New Task
          </button>
        </div>

        <div className="flex gap-3 mb-6">
          <select
            className="border rounded px-3 py-1 text-sm"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          {projectFilter && (
            <button
              onClick={() => router.push("/tasks")}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear project filter
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No tasks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-4 py-2 font-semibold text-gray-600">Title</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Assignee</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Due Date</th>
                  <th className="px-4 py-2 font-semibold text-gray-600">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{t.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.assignee?.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{t.due_date || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        value={t.status}
                        onChange={e => updateStatus(t.id, e.target.value as TaskStatus)}
                      >
                        <option value="todo">Todo</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
          <span>{total} total tasks</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Prev</button>
            <span className="px-3 py-1">Page {page}</span>
            <button disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">New Task</h2>
            <form onSubmit={createTask} className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Task title *"
                value={fTitle}
                onChange={e => setFTitle(e.target.value)}
                required
              />
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Description (optional)"
                rows={2}
                value={fDesc}
                onChange={e => setFDesc(e.target.value)}
              />
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={fProjectId}
                onChange={e => setFProjectId(e.target.value)}
                required
              >
                <option value="">Select project *</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={fAssignedTo}
                onChange={e => setFAssignedTo(e.target.value)}
              >
                <option value="">Assign to (optional)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              <input
                type="date"
                className="w-full border rounded px-3 py-2 text-sm"
                value={fDueDate}
                onChange={e => setFDueDate(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {creating ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksContent />
    </Suspense>
  );
}