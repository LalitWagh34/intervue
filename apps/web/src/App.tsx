import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, Link } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import { useSession } from "@/lib/auth";
import { useProfileStats } from "@/hooks/useProfile";
import { Analytics } from "@vercel/analytics/react";
import { SessionVerificationLoader } from "@/components/shared/SessionVerificationLoader";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/shared/CommandPalette";

// Lazy-load heavier routes to keep initial bundle size tiny and fast to parse
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AppLayout = lazy(() => import("./components/layout/AppLayout"));
const ProfileSetupPage = lazy(() => import("./pages/ProfileSetupPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const InterviewPage = lazy(() => import("./pages/InterviewPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const PracticeHubPage = lazy(() => import("./pages/PracticeHubPage"));
const LearnHomePage = lazy(() => import("./pages/LearnHomePage"));
const SubjectCatalogPage = lazy(() => import("./pages/SubjectCatalogPage"));
const ModuleTopicsPage = lazy(() => import("./pages/ModuleTopicsPage"));
const ConceptReaderPage = lazy(() => import("./pages/ConceptReaderPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const RoomsPage = lazy(() => import("./pages/rooms/RoomsPage"));
const RoomLobbyPage = lazy(() => import("./pages/rooms/RoomLobbyPage"));
const RoomArenaPage = lazy(() => import("./pages/rooms/RoomArenaPage"));
const RoomResultsPage = lazy(() => import("./pages/rooms/RoomResultsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const NotepadPage = lazy(() => import("./pages/NotepadPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));

function PageFallback() {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-6 h-6 border-2 border-[var(--border-subtle)] border-t-[var(--action-primary)] rounded-full animate-spin" />
      <span className="text-xs text-[var(--text-muted)] font-mono">Loading workspace...</span>
    </div>
  );
}

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

// Renders public pages (Landing and Login) immediately without waiting for backend cold start!
// If an authenticated session is confirmed in the background, smoothly redirects to /dashboard.
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  if (session) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

// Renders inside AppLayout when authenticated, or a lightweight public shell when logged out
// Does NOT block on useSession() so public pages (/help, /feedback) render instantly
function MixedAccessLayout() {
  const { data: session } = useSession();

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

export default function App() {
  // Speculative backend pre-warm: Wake up sleeping Render container via lightweight /health endpoint
  useEffect(() => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const serverUrl = apiBase.replace(/\/api\/?$/, "");
      fetch(`${serverUrl}/health`, { mode: "no-cors" }).catch(() => {});
    } catch {}
  }, []);

  return (
    <>
      <CommandPalette />
      <Suspense fallback={<PageFallback />}>
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
            <Route path="/learn" element={<LearnHomePage />} />
            <Route path="/learn/subjects/:slug" element={<SubjectCatalogPage />} />
            <Route path="/learn/subjects/:subjectSlug/modules/:moduleSlug" element={<ModuleTopicsPage />} />
            <Route path="/learn/concepts/:slug" element={<ConceptReaderPage />} />
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
      </Suspense>
      <Toaster position="bottom-right" richColors />
      <Analytics />
    </>
  );
}
