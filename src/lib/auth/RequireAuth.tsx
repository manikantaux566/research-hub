import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Spinner } from "../../components/ui/Spinner";

export function AuthSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white">
          R
        </div>
        <Spinner label="Loading your workspace…" />
      </div>
    </div>
  );
}

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status.status === "loading") return <AuthSplash />;
  if (status.status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

export function PublicOnly({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status.status === "loading") return <AuthSplash />;
  if (status.status === "authenticated") {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from;
    return <Navigate to={from?.pathname ?? "/"} replace />;
  }
  return children;
}