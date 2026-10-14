import { Routes, Route, Navigate } from "react-router-dom";
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
import { useSession, getSessionToken } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { Analytics } from "@vercel/analytics/react";
import { SessionVerificationLoader } from "@/components/shared/SessionVerificationLoader";
// import VoiceInterviewPage from "./pages/VoiceInterviewPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const hasToken = typeof window !== "undefined" && !!getSessionToken();

  // Instant fast-path: If user has no session token at all, avoid waiting for server timeout
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  const { data: session, isPending } = useSession();

  if (isPending) {
    return <SessionVerificationLoader title="Authenticating your session..." />;
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const hasToken = typeof window !== "undefined" && !!getSessionToken();

  // Instant fast-path
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  const { data: session, isPending: isSessionPending } = useSession();
  const { data: profileStats, isLoading: isStatsLoading } = useProfileStats();

  if (isSessionPending || isStatsLoading) {
    return (
      <SessionVerificationLoader
        title="Verifying administrator credentials..."
        subtitle="Validating role privileges & permissions..."
      />
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  const isAdmin = (session?.user as any)?.role === "admin" || profileStats?.user?.role === "admin";

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirects logged-in users away from public pages (like Landing and Login)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const hasToken = typeof window !== "undefined" && !!getSessionToken();

  // Instant fast-path: Guest visitors with no saved token see the landing page instantly
  if (!hasToken) {
    return <>{children}</>;
  }

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
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          
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