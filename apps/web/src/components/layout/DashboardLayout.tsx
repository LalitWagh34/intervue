import { useState } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { authClient } from "@/lib/auth"
import {
  LayoutDashboard,
  Mic,
  MessageSquare,
  Code2,
  Network,
  History,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Mic, label: "Voice Interview", to: "/dashboard/voice" },
  { icon: MessageSquare, label: "Text Interview", to: "/dashboard/text" },
  { icon: Code2, label: "Coding", to: "/dashboard/coding" },
  { icon: Network, label: "System Design", to: "/dashboard/system-design" },
  { icon: History, label: "History", to: "/dashboard/history" },
]

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate("/login")
  }

  const user = session?.user
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-56"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-sm tracking-tight truncate">
                Intervue
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <Separator className="bg-zinc-800" />

        {/* Bottom — user + settings */}
        <div className="px-2 py-3 space-y-0.5">
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              )
            }
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* User row */}
        <div className="border-t border-zinc-800 px-2 py-3">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarImage src={user?.image ?? ""} />
              <AvatarFallback className="bg-orange-500 text-white text-xs">
                {initials ?? "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center h-8 border-t border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-sm flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {/* Page title slot — child pages can portal into this via context if needed */}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-500 hidden sm:block">
              {user?.email}
            </div>
            <Avatar className="w-7 h-7">
              <AvatarImage src={user?.image ?? ""} />
              <AvatarFallback className="bg-orange-500 text-white text-xs">
                {initials ?? "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}