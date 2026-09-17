import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./lib/theme/ThemeProvider";
import { AuthProvider } from "./lib/auth/AuthProvider";
import { RequireAuth, PublicOnly } from "./lib/auth/RequireAuth";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Sources } from "./pages/Sources";
import { Questions } from "./pages/Questions";
import { Findings } from "./pages/Findings";
import { Insights } from "./pages/Insights";
import { Writing } from "./pages/Writing";
import { SearchPage } from "./pages/SearchPage";
import { TagsPage } from "./pages/TagsPage";
import { ReviewPage } from "./pages/ReviewPage";
import { Settings } from "./pages/Settings";
import { EntityDetailPage } from "./pages/EntityDetailPage";
import { WritingDetail } from "./components/writing/WritingDetail";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { LoginPage } from "./pages/auth/LoginPage";
import { SignupPage } from "./pages/auth/SignupPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
              <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />
              <Route path="/forgot-password" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
              <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
              <Route element={<RequireAuth />}>
                <Route element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:projectId" element={<ProjectDetail />} />
                  <Route path="projects/:projectId/:entity/:entityId" element={<EntityDetailPage />} />
                  <Route path="sources" element={<Sources />} />
                  <Route path="questions" element={<Questions />} />
                  <Route path="findings" element={<Findings />} />
                  <Route path="insights" element={<Insights />} />
                  <Route path="writing" element={<Writing />} />
                  <Route path="writing/:id" element={<WritingDetail />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="tags" element={<TagsPage />} />
                  <Route path="review" element={<ReviewPage />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="text-center">
        <p className="text-4xl font-bold text-faint">404</p>
        <p className="mt-2 text-sm text-muted">That page doesn't exist.</p>
      </div>
    </div>
  );
}