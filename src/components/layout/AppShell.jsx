import { Bell, BarChart3, LayoutDashboard, LogOut, Menu, MousePointerClick, Users, X } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Users", to: "/users", icon: Users },
  { label: "Events", to: "/events", icon: MousePointerClick },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
];

function Sidebar({ onNavigate }) {
  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-sm font-black text-white">N</div>
          <div>
            <p className="text-base font-bold text-slate-950">NudgeAI</p>
            <p className="text-xs text-slate-500">Notification Intelligence</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Engine state</p>
        <div className="mt-3 rounded-md bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <p className="text-sm font-semibold text-slate-800">Backend ready</p>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">Rules engine, Celery queue, and analytics endpoints are wired.</p>
        </div>
      </div>
    </aside>
  );
}

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-mist">
      <div className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <Sidebar />
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/30" onClick={() => setOpen(false)} aria-label="Close navigation" />
          <div className="relative h-full w-72 shadow-soft">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button className="btn-secondary px-3 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">Context-Aware Notification Engine</p>
              <p className="hidden text-xs text-slate-500 sm:block">API base: http://localhost:8000</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button className="btn-secondary px-3" onClick={logout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </button>
              <button className="btn-secondary px-3 lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
