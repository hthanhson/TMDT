import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import AdminChatButton from '../components/admin/AdminChatButton';

const AdminPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Welcome to the Admin Dashboard
          </Typography>
          <Typography variant="body1">
            This is where you would manage your application. 
            The chat support button is available at the bottom right corner.
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Active Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            User statistics would appear here...
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recent order information would appear here...
          </Typography>
        </Paper>
      </Box>
      
      {/* Chat button that floats at the bottom-right */}
      <AdminChatButton />
    </Container>
  );
};

export default AdminPage; 