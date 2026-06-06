"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  function logout() {
    Cookies.remove("token");
    router.push("/login");
  }

  const linkClass = (href: string) =>
    `flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all duration-150 ${
      pathname.startsWith(href)
        ? "bg-white/20 text-white shadow-sm"
        : "text-indigo-100 hover:bg-white/10"
    }`;

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-2">
          <span className="text-white font-bold text-sm">PM</span>
        </div>
        <span className="font-bold text-lg mr-4 text-white">Dashboard</span>

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </Link>

        <Link href="/projects" className={linkClass("/projects")}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
          </svg>
          Projects
        </Link>

        <Link href="/tasks" className={linkClass("/tasks")}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Tasks
        </Link>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm text-indigo-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
    </nav>
  );
}