import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Badge,
  Box,
  Container,
  Menu,
  MenuItem,
  Divider,
  InputBase,
  alpha,
  styled,
  useTheme
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LockIcon from '@mui/icons-material/Lock';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import NotificationService from '../services/NotificationService';
import NotificationMenu from './NotificationMenu';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

const Header: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [cartAnchorEl, setCartAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Debug authentication state và đảm bảo component re-render khi trạng thái xác thực thay đổi
  useEffect(() => {
    console.log('Auth state in Header:', { user, isAuthenticated });
    // Đảm bảo component re-render khi trạng thái xác thực thay đổi
    // Không cần làm gì thêm vì useEffect đã theo dõi user và isAuthenticated
  }, [user, isAuthenticated]);
  
  // Fetch notification count periodically
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (isAuthenticated && user) {
        try {
          const response = await NotificationService.getUnreadCount();
          setNotificationCount(response.data);
        } catch (error) {
          console.error('Error fetching notification count:', error);
          // Không cần hiển thị lỗi này nếu người dùng chưa đăng nhập
        }
      } else {
        // Đặt số thông báo về 0 nếu chưa đăng nhập
        setNotificationCount(0);
      }
    };

    // Chỉ fetch khi đã đăng nhập
    if (isAuthenticated) {
      // Fetch initially
      fetchNotificationCount();
      
      // Set up interval to fetch every 30 seconds
      const intervalId = setInterval(fetchNotificationCount, 30000);
      
      // Clean up on unmount
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated, user]);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };
  
  // Handle notification click
  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleCartClick = (event: React.MouseEvent<HTMLElement>) => {
    setCartAnchorEl(event.currentTarget);
  };

  const handleCartClose = () => {
    setCartAnchorEl(null);
  };

  const handleViewAllNotifications = () => {
    handleNotificationClose();
    navigate('/notifications');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
          >
            TMDT Shop
          </Typography>
          
          {/* Chỉ hiển thị search bar khi không phải admin */}
          {!isAdmin && (
            <Search sx={{ flexGrow: 1, maxWidth: '50%', mx: 'auto' }}>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <form onSubmit={handleSearch}>
                <StyledInputBase
                  placeholder="Tìm kiếm sản phẩm..."
                  inputProps={{ 'aria-label': 'search' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim() !== '') {
                      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                    }
                  }}
                />
              </form>
            </Search>
          )}
          
          <Box sx={{ display: 'flex', ml: 'auto' }}>
            {/* Nút sản phẩm chỉ hiển thị cho người dùng thông thường */}
            {!isAdmin && (
              <Button 
                color="inherit" 
                component={Link} 
                to="/products"
                sx={{ mr: 1 }}
              >
                Sản Phẩm
              </Button>
            )}
            
            {/* Hiển thị giỏ hàng chỉ khi không phải admin */}
            {!isAdmin && isAuthenticated && (
              <IconButton 
                color="inherit"
                onClick={handleCartClick}
                sx={{ mx: 0.5 }}
              >
                <Badge badgeContent={itemCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            )}
            
            {/* Menu giỏ hàng */}
            <Menu
              anchorEl={cartAnchorEl}
              open={Boolean(cartAnchorEl)}
              onClose={handleCartClose}
              sx={{ mt: 2 }}
            >
              <Box sx={{ width: 300, maxHeight: 400, overflow: 'auto', p: 2 }}>
                <Typography variant="h6">Giỏ hàng của bạn</Typography>
                <Divider sx={{ my: 1 }} />
                {itemCount === 0 ? (
                  <Typography variant="body2">Giỏ hàng trống</Typography>
                ) : (
                  <Typography variant="body2">{itemCount} sản phẩm trong giỏ hàng</Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    component={Link} 
                    to="/cart"
                    onClick={handleCartClose}
                  >
                    Xem giỏ hàng
                  </Button>
                  <Button 
                    variant="contained" 
                    size="small" 
                    component={Link} 
                    to="/checkout"
                    onClick={handleCartClose}
                    disabled={itemCount === 0}
                    sx={{ bgcolor: theme.palette.success.main }}
                  >
                    Thanh toán
                  </Button>
                </Box>
              </Box>
            </Menu>
            
            {/* Phần hiển thị theo trạng thái đăng nhập */}
            {isAuthenticated ? (
              isAdmin ? (
                <>
                  {/* Admin buttons */}
                  <Button 
                    color="inherit" 
                    component={Link} 
                    to="/admin/dashboard"
                    sx={{ 
                      mx: 0.5,
                      border: '1px solid white',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      },
                      bgcolor: theme.palette.primary.dark
                    }}
                    startIcon={<AdminPanelSettingsIcon />}
                  >
                    Quản lý hệ thống
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={handleLogout}
                    sx={{ 
                      mx: 0.5,
                      border: '1px solid white',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                      },
                      bgcolor: theme.palette.error.dark
                    }}
                    startIcon={<LogoutIcon />}
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  {/* Regular user buttons */}
                  <IconButton 
                    color="inherit"
                    onClick={handleNotificationClick}
                    sx={{ mx: 0.5 }}
                  >
                    <Badge badgeContent={notificationCount} color="error">
                      <NotificationsIcon />
                    </Badge>
                  </IconButton>
                  
                  {/* Notification Menu */}
                  <NotificationMenu 
                    anchorEl={notificationAnchorEl}
                    open={Boolean(notificationAnchorEl)}
                    onClose={handleNotificationClose}
                  />
                  
                  <IconButton 
                    color="inherit"
                    onClick={handleMenuOpen}
                    sx={{ mx: 0.5 }}
                  >
                    <AccountCircleIcon />
                  </IconButton>
                  
                  {/* User menu */}
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                      elevation: 0,
                      sx: {
                        overflow: 'visible',
                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        mt: 1.5,
                        '& .MuiAvatar-root': {
                          width: 32,
                          height: 32,
                          ml: -0.5,
                          mr: 1,
                        },
                        '&:before': {
                          content: '""',
                          display: 'block',
                          position: 'absolute',
                          top: 0,
                          right: 14,
                          width: 10,
                          height: 10,
                          bgcolor: 'background.paper',
                          transform: 'translateY(-50%) rotate(45deg)',
                          zIndex: 0,
                        },
                      },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <MenuItem component={Link} to="/profile">
                      <PersonIcon sx={{ mr: 1 }} /> Hồ sơ
                    </MenuItem>
                    <MenuItem component={Link} to="/orders">
                      <HistoryIcon sx={{ mr: 1 }} /> Đơn hàng
                    </MenuItem>
                    <MenuItem component={Link} to="/wishlist">
                      <FavoriteIcon sx={{ mr: 1 }} /> Danh sách yêu thích
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} /> Đăng xuất
                    </MenuItem>
                  </Menu>
                </>
              )
            ) : (
              <>
                {/* Nút đăng nhập và đăng ký cho khách */}
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/login"
                  sx={{ 
                    mx: 0.5,
                    border: '1px solid white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    },
                    bgcolor: theme.palette.primary.dark
                  }}
                >
                  Đăng Nhập
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/register"
                  sx={{ 
                    mx: 0.5,
                    bgcolor: theme.palette.secondary.main,
                    '&:hover': {
                      bgcolor: theme.palette.secondary.dark
                    }
                  }}
                >
                  Đăng Ký
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;