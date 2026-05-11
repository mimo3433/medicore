import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'DOCTOR' | 'PATIENT';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'PATIENT') {
      return <Navigate to="/dashboard/patient" replace />;
    } else if (user.role === 'DOCTOR') {
      return <Navigate to="/dashboard/doctor" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/dashboard/admin" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
