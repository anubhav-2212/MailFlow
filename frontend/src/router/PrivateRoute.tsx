import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Renders children only when the user IS authenticated.
 * While the session check is in-flight, renders nothing (avoids flash).
 * Once resolved, unauthenticated visitors are sent to /login.
 */
export function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
