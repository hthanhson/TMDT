import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  LocalShipping,
  Inventory,
  Dashboard,
  Person,
  Logout,
  Home
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ShipperHeader = () => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleCloseUserMenu();
  };

  return (
    <AppBar position="static" sx={{ mb: 2, bgcolor: '#1976d2' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Desktop Logo */}
          <LocalShipping sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/shipper/dashboard"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            SHIPPER
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="shipper menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/shipper/dashboard'); }}>
                <ListItemIcon>
                  <Dashboard fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Dashboard</Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/shipper/available-orders'); }}>
                <ListItemIcon>
                  <Inventory fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Đơn hàng có sẵn</Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/shipper/my-orders'); }}>
                <ListItemIcon>
                  <LocalShipping fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Đơn hàng của tôi</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/'); }}>
                <ListItemIcon>
                  <Home fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Trang chủ</Typography>
              </MenuItem>
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <LocalShipping sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component={Link}
            to="/shipper/dashboard"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            SHIPPER
          </Typography>

          {/* Desktop Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            <Button
              onClick={() => navigate('/shipper/dashboard')}
              sx={{ my: 2, color: 'white', display: 'flex', alignItems: 'center' }}
              startIcon={<Dashboard />}
            >
              Dashboard
            </Button>
            <Button
              onClick={() => navigate('/shipper/available-orders')}
              sx={{ my: 2, color: 'white', display: 'flex', alignItems: 'center' }}
              startIcon={<Inventory />}
            >
              Đơn hàng có sẵn
            </Button>
            <Button
              onClick={() => navigate('/shipper/my-orders')}
              sx={{ my: 2, color: 'white', display: 'flex', alignItems: 'center' }}
              startIcon={<LocalShipping />}
            >
              Đơn hàng của tôi
            </Button>
            <Button
              onClick={() => navigate('/')}
              sx={{ my: 2, color: 'white', display: 'flex', alignItems: 'center' }}
              startIcon={<Home />}
            >
              Trang chủ
            </Button>
          </Box>

          {/* User Menu */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Tùy chọn">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar 
                  alt={user?.username || 'Shipper'} 
                  src="/static/images/avatar/1.jpg"
                  sx={{ bgcolor: 'primary.dark' }}
                >
                  {user?.username?.charAt(0) || 'S'}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Hồ sơ</Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Đăng xuất</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default ShipperHeader; 