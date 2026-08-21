import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './router/PrivateRoute';
import { PublicRoute } from './router/PublicRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import CampaignsPage from './pages/CampaignsPage';
import DashboardPage from './pages/DashboardPage';

function DashboardPlaceholder({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">This section is ready for future dashboard content.</p>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Root → always send to /login; guards handle the rest */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public-only: redirect authenticated users to /dashboard */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Private: authenticated users only.
          DashboardLayout provides the shell (sidebar + topbar + <Outlet />).
          Add future dashboard child routes here alongside /dashboard. */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="scheduled" element={<DashboardPlaceholder title="Scheduled" />} />
          <Route path="sent" element={<DashboardPlaceholder title="Sent" />} />
        </Route>
      </Route>

      {/* Fallback for unknown paths */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
