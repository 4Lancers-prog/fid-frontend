import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FullPageLoader } from '../components/common/Spinner';
import type { UserRole } from '../types';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const status = useAuthStore((s) => s.status);
  const hasRole = useAuthStore((s) => s.hasRole);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') return <FullPageLoader label="Restoring your session…" />;
  if (status === 'unauthenticated') {
    // Admin areas send you to the admin portal; everything else to the user login.
    const isAdminArea = location.pathname.startsWith('/admin') || location.pathname.startsWith('/reports');
    return <Navigate to={isAdminArea ? '/admin/login' : '/login'} replace />;
  }
  if (roles && !hasRole(...roles)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
