import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role || "")) {
    if (role === "psdm") return <Navigate to="/admin" replace />;
    if (role === "pemandu") return <Navigate to="/pemandu" replace />;
    if (role === "user") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
