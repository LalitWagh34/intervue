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

import { useSession } from "@/lib/auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        Loading...
      </div>
    );
  if (!session) return <Navigate to="/login" />;

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

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
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}