"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { Project } from "@/lib/types";
import Navbar from "@/components/Navbar";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    fetchProjects();
  }, [page]);

  async function fetchProjects() {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/projects?page=${page}&page_size=10`);
      setProjects(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post("/api/projects", { name, description });
      setShowModal(false);
      setName("");
      setDescription("");
      fetchProjects();
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(id: number) {
    if (!confirm("Delete this project?")) return;
    await api.delete(`/api/projects/${id}`);
    fetchProjects();
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + New Project
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No projects yet. Create one!</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4 flex items-start justify-between shadow-sm">
                <div>
                  <h2
                    className="font-semibold text-gray-800 cursor-pointer hover:text-blue-600"
                    onClick={() => router.push(`/tasks?project_id=${p.id}`)}
                  >
                    {p.name}
                  </h2>
                  {p.description && (
                    <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Created {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/tasks?project_id=${p.id}`)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View Tasks
                  </button>
                  <button
                    onClick={() => deleteProject(p.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-6 text-sm text-gray-600">
          <span>{total} total projects</span>
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
            <h2 className="text-lg font-bold mb-4">New Project</h2>
            <form onSubmit={createProject} className="space-y-3">
              <input
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Project name *"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Description (optional)"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}