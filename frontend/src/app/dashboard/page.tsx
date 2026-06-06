"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface Stats {
  totalProjects: number;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  recentProjects: any[];
  recentTasks: any[];
}

const COLORS = ["#818cf8", "#fb923c", "#34d399"];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    doneTasks: 0,
    recentProjects: [],
    recentTasks: [],
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!Cookies.get("token")) { router.push("/login"); return; }
    fetchStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const [projectsRes, tasksRes, todoRes, inProgressRes, doneRes, meRes] = await Promise.all([
        api.get("/api/projects?page=1&page_size=100"),
        api.get("/api/tasks?page=1&page_size=100"),
        api.get("/api/tasks?status=todo&page=1&page_size=100"),
        api.get("/api/tasks?status=in_progress&page=1&page_size=100"),
        api.get("/api/tasks?status=done&page=1&page_size=100"),
        api.get("/api/users/me"),
      ]);
      setStats({
        totalProjects: projectsRes.data.total,
        totalTasks: tasksRes.data.total,
        todoTasks: todoRes.data.total,
        inProgressTasks: inProgressRes.data.total,
        doneTasks: doneRes.data.total,
        recentProjects: projectsRes.data.items.slice(0, 5),
        recentTasks: tasksRes.data.items.slice(0, 5),
      });
      setUserName(meRes.data.name);
      setUserRole(meRes.data.role);
    } finally {
      setLoading(false);
    }
  }

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.doneTasks / stats.totalTasks) * 100)
    : 0;

  const pieData = [
    { name: "Todo", value: stats.todoTasks || 0 },
    { name: "In Progress", value: stats.inProgressTasks || 0 },
    { name: "Done", value: stats.doneTasks || 0 },
  ];

  const areaData = [
    { name: "Todo", tasks: stats.todoTasks },
    { name: "In Progress", tasks: stats.inProgressTasks },
    { name: "Done", tasks: stats.doneTasks },
    { name: "Total", tasks: stats.totalTasks },
  ];

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
    todo: { label: "Todo", bg: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
    in_progress: { label: "In Progress", bg: "bg-orange-100 text-orange-600", dot: "bg-orange-400" },
    done: { label: "Done", bg: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-400" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto py-8 px-4 space-y-6">

        {/* Hero Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white shadow-2xl">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
          <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
                <span className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                {greeting()}, {userName}! 👋
              </h1>
              <p className="text-indigo-200 text-sm max-w-md">
                You have <span className="text-white font-semibold">{stats.inProgressTasks} tasks</span> in progress
                and <span className="text-white font-semibold">{stats.todoTasks} tasks</span> waiting to start.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  userRole === "admin" ? "bg-amber-400/30 text-amber-200" : "bg-indigo-400/30 text-indigo-200"
                }`}>
                  {userRole === "admin" ? "⭐ Admin" : "👨‍💻 Developer"}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => router.push("/projects")}
                className="group flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 border border-white/20"
              >
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
              <button
                onClick={() => router.push("/tasks")}
                className="group flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-medium px-5 py-2.5 rounded-xl transition-all duration-200 shadow-lg"
              >
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Task
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-indigo-200 font-medium">Overall Completion</span>
              <span className="text-xs text-white font-bold">{completionRate}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-300 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Projects",
              value: stats.totalProjects,
              change: "All time",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ),
              gradient: "from-indigo-500 to-indigo-600",
              bg: "bg-indigo-50",
              text: "text-indigo-600",
              onClick: () => router.push("/projects"),
            },
            {
              label: "Total Tasks",
              value: stats.totalTasks,
              change: "All time",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
              gradient: "from-violet-500 to-violet-600",
              bg: "bg-violet-50",
              text: "text-violet-600",
              onClick: () => router.push("/tasks"),
            },
            {
              label: "In Progress",
              value: stats.inProgressTasks,
              change: "Active now",
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              gradient: "from-orange-500 to-orange-600",
              bg: "bg-orange-50",
              text: "text-orange-600",
              onClick: () => router.push("/tasks?status=in_progress"),
            },
            {
              label: "Completed",
              value: stats.doneTasks,
              change: `${completionRate}% rate`,
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              gradient: "from-emerald-500 to-emerald-600",
              bg: "bg-emerald-50",
              text: "text-emerald-600",
              onClick: () => router.push("/tasks?status=done"),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              onClick={stat.onClick}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bg} ${stat.text} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  {stat.icon}
                </div>
                <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-lg">
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Area Chart - takes 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Task Overview</h2>
                <p className="text-xs text-slate-400 mt-0.5">Distribution across all statuses</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                <span className="text-xs text-slate-500">Tasks</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    fontSize: "12px"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#taskGradient)"
                  dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#6366f1" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base font-bold text-slate-800">Completion Rate</h2>
              <p className="text-xs text-slate-400 mt-0.5">Task status breakdown</p>
            </div>
            {stats.totalTasks === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-300">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No tasks yet</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        fontSize: "12px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {[
                    { label: "Todo", value: stats.todoTasks, color: "bg-indigo-400" },
                    { label: "In Progress", value: stats.inProgressTasks, color: "bg-orange-400" },
                    { label: "Done", value: stats.doneTasks, color: "bg-emerald-400" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-xs text-slate-500">{item.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Projects */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-800">Recent Projects</h2>
                <p className="text-xs text-slate-400 mt-0.5">Latest project activity</p>
              </div>
              <button
                onClick={() => router.push("/projects")}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {stats.recentProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm">No projects yet</p>
                </div>
              ) : (
                stats.recentProjects.map((p, i) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/tasks?project_id=${p.id}`)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-50">
              <div>
                <h2 className="text-base font-bold text-slate-800">Recent Tasks</h2>
                <p className="text-xs text-slate-400 mt-0.5">Latest task updates</p>
              </div>
              <button
                onClick={() => router.push("/tasks")}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                View all →
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {stats.recentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm">No tasks yet</p>
                </div>
              ) : (
                stats.recentTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => router.push("/tasks")}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusConfig[t.status]?.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                        {t.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {t.assignee ? `👤 ${t.assignee.name}` : "Unassigned"}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[t.status]?.bg}`}>
                      {statusConfig[t.status]?.label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "New Project",
                desc: "Start a project",
                icon: "M12 4v16m8-8H4",
                color: "from-indigo-500 to-indigo-600",
                onClick: () => router.push("/projects"),
              },
              {
                label: "New Task",
                desc: "Add a task",
                icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                color: "from-violet-500 to-violet-600",
                onClick: () => router.push("/tasks"),
              },
              {
                label: "View Projects",
                desc: "Browse projects",
                icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
                color: "from-emerald-500 to-emerald-600",
                onClick: () => router.push("/projects"),
              },
              {
                label: "View Tasks",
                desc: "Manage tasks",
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                color: "from-orange-500 to-orange-600",
                onClick: () => router.push("/tasks"),
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="group flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all duration-200 text-left"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{action.label}</p>
                  <p className="text-xs text-slate-400">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}