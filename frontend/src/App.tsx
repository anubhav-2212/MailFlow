import { Routes, Route, Navigate } from 'react-router-dom';

import { PrivateRoute } from './router/PrivateRoute';
import { PublicRoute } from './router/PublicRoute';

import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import SendersPage from './pages/SenderPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import ScheduledEmailsPage from './pages/ScheduledEmailsPage';
import SentEmailsPage from './pages/SentEmailsPage';



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

          {/* Individual campaign */}
          <Route
            path="campaigns/:campaignId"
            element={<CampaignDetailPage />}
          />

          {/* Senders */}
          <Route
            path="senders"
            element={<SendersPage />}
          />

          {/* Scheduled */}
          <Route
            path="scheduled"
            element={<ScheduledEmailsPage />}
          />

          {/* Sent */}
          <Route
            path="sent"
            element={<SentEmailsPage />}
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