import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  // Not authenticated
  if (!isAuthenticated) {
    console.log('AdminRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is an admin using isAdmin from context
  if (!isAdmin) {
    console.log('AdminRoute: User is not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute: User is admin, rendering admin content');
  return <>{children}</>;
};

export default AdminRoute; 