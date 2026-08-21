import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Renders children only when the user is NOT authenticated.
 * While the session check is in-flight, renders nothing (avoids flash).
 * Once resolved, authenticated users are sent to /dashboard.
 */
export function PublicRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
