import { Routes, Route, Navigate, Outlet, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AppLayout from "./components/layout/AppLayout";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import ProfilePage from "./pages/ProfilePage";
import InterviewPage from "./pages/InterviewPage";
import ResultsPage from "./pages/ResultsPage";
import PracticeHubPage from "./pages/PracticeHubPage";
import HistoryPage from "./pages/HistoryPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import CodingPage from "./pages/CodingPage";
import RoomsPage from "./pages/rooms/RoomsPage";
import RoomLobbyPage from "./pages/rooms/RoomLobbyPage";
import RoomArenaPage from "./pages/rooms/RoomArenaPage";
import RoomResultsPage from "./pages/rooms/RoomResultsPage";
import NotFoundPage from "./pages/NotFoundPage";
import { useEffect } from "react";
import NotepadPage from "./pages/NotepadPage";
import BookmarksPage from "./pages/BookmarksPage";
import HelpCenterPage from "./pages/HelpCenterPage";
import FeedbackPage from "./pages/FeedbackPage";
import { useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { Analytics } from "@vercel/analytics/react";
import { SessionVerificationLoader } from "@/components/shared/SessionVerificationLoader";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { toast } from "sonner";
// import VoiceInterviewPage from "./pages/VoiceInterviewPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <SessionVerificationLoader title="Authenticating your session..." />;
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const { data: profileStats, isLoading: isStatsLoading } = useProfileStats();

  const isAdmin = (session?.user as any)?.role === "admin" || profileStats?.user?.role === "admin";

  useEffect(() => {
    if (!isSessionPending && !isStatsLoading && session && !isAdmin) {
      toast.error("Admin access required", {
        description: "You need administrator privileges to access the Admin Management CMS.",
      });
    }
  }, [isSessionPending, isStatsLoading, session, isAdmin]);

  if (isSessionPending || isStatsLoading) {
    return (
      <SessionVerificationLoader
        title="Verifying administrator credentials..."
        subtitle="Validating role privileges & permissions..."
      />
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirects logged-in users away from public pages (like Landing and Login)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <SessionVerificationLoader
        title="Checking your session..."
        subtitle="Resuming your active workspace..."
      />
    );
  }

  if (session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

// Renders inside AppLayout when authenticated, or a lightweight public shell when logged out
function MixedAccessLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <SessionVerificationLoader
        title="Loading page..."
        subtitle="Preparing your workspace..."
      />
    );
  }

  if (session) {
    return <AppLayout />;
  }

  return (
    <div className="min-h-screen bg-[#08090C] text-[#EDEDED] flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[#181A20] bg-[#08090C]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo />
          </Link>
          <nav aria-label="Public navigation" className="flex items-center gap-4 text-xs font-medium text-zinc-400">
            <Link to="/help" className="hover:text-white transition-colors">
              Help Center
            </Link>
            <Link to="/feedback" className="hover:text-white transition-colors">
              Feedback
            </Link>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg bg-[#327CF6] hover:bg-[#2563EB] text-white font-semibold transition-colors"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}

import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/shared/CommandPalette";

export default function App() {
  // Speculative backend pre-warm: Wake up sleeping Render container in background on first visit
  useEffect(() => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const serverUrl = apiBase.replace(/\/api\/?$/, "");
      fetch(`${serverUrl}/`, { mode: "no-cors" }).catch(() => {});
    } catch {}
  }, []);

  return (
    <>
      <CommandPalette />
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

        <Route element={<MixedAccessLayout />}>
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Route>

        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/practice" element={<PracticeHubPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/:panel"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route path="/notes" element={<NotepadPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          
          {/* Coding Practice disabled for V1 - redirect to Prep Hub */}
          <Route path="/coding" element={<Navigate to="/practice" replace />} />
          <Route path="/coding/:slug" element={<Navigate to="/practice" replace />} />
          
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:code/lobby" element={<RoomLobbyPage />} />
          <Route path="/rooms/:code/results" element={<RoomResultsPage />} />
          {/* <Route path="/voice-interview" element={<VoiceInterviewPage />} /> */}
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="/rooms/:code/arena"
          element={
            <ProtectedRoute>
              <RoomArenaPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster position="bottom-right" richColors />
      <Analytics />
    </>
  );
}
