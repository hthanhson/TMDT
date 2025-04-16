import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type ShipperRouteProps = {
  children: React.ReactNode;
};

const ShipperRoute = ({ children }: ShipperRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  
  // Kiểm tra nếu người dùng đã đăng nhập và có vai trò SHIPPER
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user || !user.roles || !user.roles.includes('ROLE_SHIPPER')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ShipperRoute; 