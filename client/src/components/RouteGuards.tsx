import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Spinner } from './ui/Spinner';

function FullScreenSpinner(): JSX.Element {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" className="text-brand-600" />
    </div>
  );
}

export function RequireAuth(): JSX.Element {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function GuestOnly(): JSX.Element {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
