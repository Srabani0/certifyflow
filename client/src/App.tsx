import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { GuestOnly, RequireAuth } from './components/RouteGuards';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { EventsListPage } from './pages/events/EventsListPage';
import { TemplatesGalleryPage } from './pages/TemplatesGalleryPage';
import { VerifyPage } from './pages/VerifyPage';

function NotFoundPage(): JSX.Element {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 text-gray-500">
      <p className="text-lg font-semibold text-gray-900">Page not found</p>
      <p className="text-sm">The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/verify/:certificateId" element={<VerifyPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsListPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/templates" element={<TemplatesGalleryPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
