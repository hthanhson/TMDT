import React, { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  // Debug logging for admin route access
  useEffect(() => {
    console.log('==== AdminRoute Access Check ====');
    console.log('Current route:', location.pathname);
    console.log('Is user authenticated?', isAuthenticated);
    console.log('User object exists?', !!user);
    if (user) {
      console.log('User ID:', user.id);
      console.log('Username:', user.username);
      console.log('User roles:', user.roles);
      console.log('Roles type:', typeof user.roles);
      console.log('Is roles array?', Array.isArray(user.roles));
      
      // Check each role variant
      const hasAdminRole = (
        user.roles.includes('ADMIN') || 
        user.roles.includes('ROLE_ADMIN') || 
        user.roles.includes('admin') || 
        user.roles.includes('role_admin')
      );
      console.log('Has any admin role variant?', hasAdminRole);
    }
    console.log('isAdmin from context:', isAdmin);
    console.log('================================');
  }, [location.pathname, user, isAuthenticated, isAdmin]);

  // Not authenticated
  if (!isAuthenticated) {
    console.log('AdminRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is an admin
  if (!isAdmin) {
    console.log('AdminRoute: User is not admin, redirecting to home');
    console.log('User roles:', user?.roles);
    
    // Check token validity
    const token = user?.accessToken || (user as any)?.token;
    if (token) {
      console.log('Token present but still not authorized as admin');
      console.log('Token format valid?', token.startsWith('ey'));
      console.log('Token length:', token.length);
    } else {
      console.log('No valid token found');
    }
    
    return <Navigate to="/" replace />;
  }

  console.log('AdminRoute: User is admin, rendering admin content');
  return <>{children}</>;
};

export default AdminRoute; 