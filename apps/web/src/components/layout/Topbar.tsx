import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, authClient } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

export default function Topbar({ title }: { title: string }) {
  const { data: session } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-30">
      <h1 className="text-white font-semibold text-base">{title}</h1>

      <div className="flex items-center gap-3">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-zinc-800 transition-colors">
              <Avatar className="w-7 h-7">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="bg-violet-700 text-white text-xs">
                  {initials ?? "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-zinc-300 max-w-32 truncate">
                {user?.name ?? "User"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-zinc-900 border-zinc-800 text-zinc-300"
          >
            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="hover:bg-zinc-800 cursor-pointer"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="hover:bg-zinc-800 cursor-pointer"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="hover:bg-zinc-800 cursor-pointer text-red-400"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}