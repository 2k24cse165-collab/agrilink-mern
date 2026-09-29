import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Wrap any route element in <ProtectedRoute role="farmer">…</ProtectedRoute>
 * — redirects to /login if not authed, /browse if role mismatch.
 */
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (role && user.role !== role && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}
