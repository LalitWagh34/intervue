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
import NotepadPage from "./pages/NotepadPage";
import BookmarksPage from "./pages/BookmarksPage";
import { useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
// import VoiceInterviewPage from "./pages/VoiceInterviewPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending)
    return (
      <div className="flex items-center justify-center h-screen bg-[#060709] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  if (!session) return <Navigate to="/login" />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const { data: profileStats, isLoading: isStatsLoading } = useProfileStats();

  if (isSessionPending || isStatsLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-[#060709] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  if (!session) return <Navigate to="/login" />;

  const isAdmin = (session?.user as any)?.role === "admin" || profileStats?.user?.role === "admin";

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirects logged-in users away from public pages (like Landing and Login)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending)
    return (
      <div className="flex items-center justify-center h-screen bg-[#060709] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  if (session) return <Navigate to="/dashboard" />;

  return <>{children}</>;
}

import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/shared/CommandPalette";

export default function App() {
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
          {/* Coding Practice disabled for V1 */}
          <Route path="/coding" element={<NotFoundPage />} />
          <Route path="/coding/:slug" element={<NotFoundPage />} />
          
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
    </>
  );
}