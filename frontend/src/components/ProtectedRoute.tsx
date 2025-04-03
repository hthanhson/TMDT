import React, { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: string;
  adminOnly?: boolean;
  children?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, adminOnly, children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If adminOnly flag is set, check if user is an admin
  if (adminOnly && user?.roles) {
    const isAdmin = user.roles.includes('ROLE_ADMIN');
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }
  
  // If role is required, check if user has that role
  if (requiredRole && user?.roles) {
    const hasRequiredRole = user.roles.includes(requiredRole);
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  // If children are provided, render them, otherwise render the Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute; 