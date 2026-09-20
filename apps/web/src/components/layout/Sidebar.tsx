import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Mic,
  History,
  Trophy,
  MessageSquare,
  User,
  Code2,
  LogOut,
  Settings,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Practice", icon: Mic, href: "/practice" },
  { label: "Coding", icon: Code2, href: "/coding" },
  { label: "Battle Arena", icon: Swords, href: "/rooms" },
  { label: "History", icon: History, href: "/history" },
  { label: "AI Chat", icon: MessageSquare, href: "/chat" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Profile", icon: User, href: "/profile" },
  { label: "Admin", icon: Settings, href: "/admin" },
];

export default function Sidebar() {
  const location = useLocation();
  const { data: session } = useSession();
  const navigate = useNavigate();

  return (
    <aside className="w-60 h-screen bg-[#09090b] border-r border-zinc-900 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-5 flex items-center gap-2.5 border-b border-zinc-900">
        <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-xs">I</span>
        </div>
        <span className="text-white font-semibold tracking-tight">Intervue</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-amber-400/10 text-amber-400 font-medium"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-amber-400" : "")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-zinc-900">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          {session?.user?.image ? (
            <img src={session.user.image} className="w-7 h-7 rounded-full" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-xs text-amber-400 font-medium">
              {session?.user?.name?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-medium truncate">{session?.user?.name}</p>
            <p className="text-[10px] text-zinc-600 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut().then(() => navigate("/"))}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 w-full rounded-lg hover:bg-zinc-900 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}