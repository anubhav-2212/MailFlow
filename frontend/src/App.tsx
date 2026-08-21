import { Routes, Route, Navigate } from 'react-router-dom';

import { PrivateRoute } from './router/PrivateRoute';
import { PublicRoute } from './router/PublicRoute';

import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import SendersPage from './pages/SenderPage';

function DashboardPlaceholder({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>

      <p className="mt-2 text-sm text-slate-500">
        This section is ready for future dashboard content.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Root */}
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Public routes */}
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={<LoginPage />}
        />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<PrivateRoute />}>
        <Route
          path="/dashboard"
          element={<DashboardLayout />}
        >
          {/* Dashboard home */}
          <Route
            index
            element={<DashboardPage />}
          />

          {/* Campaigns */}
          <Route
            path="campaigns"
            element={<CampaignsPage />}
          />

          {/* Senders */}
          <Route
            path="senders"
            element={<SendersPage />}
          />

          {/* Scheduled */}
          <Route
            path="scheduled"
            element={
              <DashboardPlaceholder title="Scheduled" />
            }
          />

          {/* Sent */}
          <Route
            path="sent"
            element={
              <DashboardPlaceholder title="Sent" />
            }
          />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}