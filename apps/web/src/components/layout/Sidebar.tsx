import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Mic, History, Trophy, MessageSquare, User, Code2, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Practice", icon: Mic, href: "/practice" },
  { label: "Coding", icon: Code2, href: "/coding" },
  { label: "History", icon: History, href: "/history" },
  { label: "AI Chat", icon: MessageSquare, href: "/chat" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Profile", icon: User, href: "/profile" },
];

export default function Sidebar() {
  const location = useLocation();
  const { data: session } = useSession();

  return (
    <aside className="w-60 h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col fixed left-0 top-0">
      <div className="p-5 flex items-center gap-2 border-b border-zinc-800">
        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
          <span className="text-black font-bold text-xs">I</span>
        </div>
        <span className="text-white font-semibold">Intervue</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-2 px-2 py-2">
          {session?.user?.image ? (
            <img src={session.user.image} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white">
              {session?.user?.name?.[0] || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{session?.user?.name}</p>
            <p className="text-xs text-zinc-500 truncate">{session?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-2 py-2 text-sm text-zinc-400 hover:text-white w-full rounded-lg hover:bg-zinc-900"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}