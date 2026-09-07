import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.js';
import { Spinner } from './components/ui.js';
import { AppShell } from './components/AppShell.js';
import { LoginPage } from './pages/Login.js';
import { SignupPage } from './pages/Signup.js';
import { HomePage } from './pages/Home.js';
import { ProjectsPage } from './pages/Projects.js';
import { ProjectWorkspace } from './pages/ProjectWorkspace.js';
import { NotificationsPage } from './pages/Notifications.js';
import { InvitationsPage } from './pages/Invitations.js';
import { ProfilePage } from './pages/Profile.js';
import { SettingsPage } from './pages/Settings.js';
import { HistoryPage } from './pages/History.js';
import { PrintReport } from './pages/PrintReport.js';

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}><Spinner /></div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId/print" element={<PrintReport />} />
        <Route path="/projects/:projectId/*" element={<ProjectWorkspace />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
