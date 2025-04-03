import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Box, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Nếu user là admin, chuyển hướng đến trang admin dashboard
    if (isAuthenticated && isAdmin) {
      console.log('Layout: User is admin, redirecting to admin dashboard');
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, isAdmin, navigate]);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          {children || <Outlet />}
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout; 