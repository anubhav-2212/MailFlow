import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './router/PrivateRoute';
import { PublicRoute } from './router/PublicRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <Routes>
      {/* Root → always send to /login; guards handle the rest */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public-only: redirect authenticated users to /dashboard */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Private: redirect unauthenticated users to /login */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      {/* Fallback for unknown paths */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}