import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#08090c] text-slate-100 relative overflow-hidden flex">
      {/* Ambient background glow layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="ambient-glow w-[550px] h-[550px] bg-blue-600/10 top-[-100px] right-[-100px]" />
        <div className="ambient-glow w-[600px] h-[600px] bg-violet-600/10 bottom-[-150px] left-[15%]" />
        <div className="ambient-glow w-[400px] h-[400px] bg-cyan-500/5 top-[40%] right-[25%]" />
      </div>

      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="ml-64 flex-1 min-h-screen relative z-10">
        <Outlet />
      </main>
    </div>
  );
}