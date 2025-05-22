import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Badge,
  IconButton,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            {/* TMDT Shop */}
          </Typography>
          
          <Button
            color="inherit"
            component={RouterLink}
            to="/products"
            sx={{ mx: 1 }}
          >
            Products
          </Button>
          
          <IconButton
            color="inherit"
            component={RouterLink}
            to="/cart"
            sx={{ mx: 1 }}
          >
            <Badge badgeContent={0} color="error">
              <CartIcon />
            </Badge>
          </IconButton>
          
          <IconButton
            color="inherit"
            component={RouterLink}
            to="/orders"
            sx={{ mx: 1 }}
          >
            <PersonIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} TMDT Shop. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 