import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Paper,
  Popper,
  ClickAwayListener,
  CircularProgress
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Notifications as NotificationsIcon,
  History as HistoryIcon,
  AdminPanelSettings as AdminPanelSettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import SearchBar from './SearchBar';
import NotificationService from '../services/NotificationService';
import { Notification } from '../types/notification';
import NotificationMenu from './NotificationMenu';
import ProductService from '../services/productService';

// Custom debounce function to eliminate lodash dependency
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timer = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );
}

const NOTIFICATION_UPDATE_EVENT = 'notification-update-event';

// Create a public function to trigger notification refresh from anywhere in the app
export const refreshHeaderNotifications = () => {
  console.log("Triggering global header notification refresh");
  const event = new CustomEvent(NOTIFICATION_UPDATE_EVENT);
  window.dispatchEvent(event);
  console.log("ok123")
  // Add a fallback approach - sometimes events might not work reliably
  // Try to directly fetch notifications through the service
  try {
    NotificationService.getNotifications();
  } catch (error) {
    console.error("Error in direct notification fetch:", error);
  }
};

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  
  // Search suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Function to fetch search suggestions
  const fetchSuggestionsImpl = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    try {
      setLoadingSuggestions(true);
      const response = await ProductService.getSearchSuggestions(query);
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Use our custom debounce hook
  const fetchSearchSuggestions = useDebounce(fetchSuggestionsImpl, 300);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setShowSuggestions(true);
      fetchSearchSuggestions(query);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setShowSuggestions(false);
    navigate(`/products/${suggestion.id}`);
  };
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);
      const response = await NotificationService.getNotifications();
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  // Add a consistent function to check if a notification is read
  const isNotificationRead = (notification: any) => {
    // Check both 'isRead' and 'read' properties since the API is using 'read'
    const isReadValue = notification.isRead !== undefined ? notification.isRead : notification.read;
    
    // Convert considering all possible formats
    return isReadValue === true || 
      (typeof isReadValue === 'number' && isReadValue === 1) || 
      (typeof isReadValue === 'string' && isReadValue === "1") || 
      (typeof isReadValue === 'string' && isReadValue === "true");
  };

  // Add a handler to refresh notifications when they're updated in the menu
  const handleNotificationsUpdate = () => {
    console.log("Refreshing notifications from NotificationMenu update");
    fetchLatestNotifications();
  };

  // Define fetchLatestNotifications with useCallback to prevent recreation on rerenders
  const fetchLatestNotifications = useCallback(() => {
    if (isAuthenticated && user) {
      console.log("Fetching latest notifications in Header component");
      setNotificationLoading(true);
      NotificationService.getNotifications()
        .then(response => {
          setNotifications(response.data);
          const newUnreadCount = response.data.filter(n => !isNotificationRead(n)).length;
          setNotificationCount(newUnreadCount);
          console.log("Updated notifications: Total:", response.data.length, "Unread:", newUnreadCount);
        })
        .catch(error => {
          console.error('Error refreshing notifications:', error);
        })
        .finally(() => {
          setNotificationLoading(false);
        });
    }
  }, [isAuthenticated, user]); // Add dependencies

  // Listen for the custom notification refresh event
  useEffect(() => {
    const handleNotificationRefresh = () => {
      console.log("Header received notification refresh event");
      fetchLatestNotifications();
    };

    // Add event listener
    window.addEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationRefresh);

    // Clean up event listener
    return () => {
      window.removeEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationRefresh);
    };
  }, [fetchLatestNotifications]); // Add fetchLatestNotifications as dependency

  const handleClickAway = () => {
    setShowSuggestions(false);
  };

  const unreadCount = notifications.filter(n => !isNotificationRead(n)).length;
  console.log("Total notifications:", notifications.length, "Unread notifications:", unreadCount);
  
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
            {/* TMDT Shop */}
          </Typography>
          
          {/* Chỉ hiển thị search bar khi không phải admin */}
          {!isAdmin && (
            <ClickAwayListener onClickAway={handleClickAway}>
              <Box ref={searchContainerRef} sx={{ position: 'relative', flexGrow: 1, maxWidth: '50%', mx: 'auto' }}>
                <SearchBar
                  searchQuery={searchQuery}
                  setSearchQuery={handleSearchChange}
                  handleSearch={handleSearch}
                />
                
                {showSuggestions && searchQuery.trim().length > 1 && (
                  <Paper
                    elevation={3}
                    sx={{
                      position: 'absolute',
                      zIndex: 1,
                      width: '100%',
                      maxHeight: '300px',
                      overflow: 'auto',
                      mt: 0.5
                    }}
                  >
                    {loadingSuggestions ? (
                      <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : suggestions.length > 0 ? (
                      <List dense>
                        {suggestions.map((suggestion, index) => (
                          <ListItem
                            button
                            key={suggestion.id || index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            {suggestion.imageUrl && (
                              <Box
                                component="img"
                                src={suggestion.imageUrl}
                                alt={suggestion.name}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  objectFit: 'cover',
                                  mr: 1,
                                  borderRadius: 1
                                }}
                              />
                            )}
                            <Box>
                              <Typography variant="body2">{suggestion.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {suggestion.price && `${suggestion.price.toLocaleString('vi-VN')}đ`}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                        <Divider />
                        <ListItem
                          button
                          onClick={() => {
                            setShowSuggestions(false);
                            navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
                          }}
                          sx={{
                            justifyContent: 'center',
                            color: theme.palette.primary.main,
                            fontWeight: 'bold',
                          }}
                        >
                          <Typography variant="body2">
                            Xem tất cả kết quả cho "{searchQuery}"
                          </Typography>
                        </ListItem>
                      </List>
                    ) : (
                      <Box p={2}>
                        <Typography variant="body2" color="text.secondary">
                          Không tìm thấy sản phẩm phù hợp
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>
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
                  <CartIcon />
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
                  <Tooltip title="Notifications">
                    <IconButton
                      onClick={handleNotificationMenuOpen}
                      size="large"
                      color="inherit"
                      sx={{ mr: 1 }}
                    >
                      <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  
                  {/* Notification Menu */}
                  <NotificationMenu 
                    anchorEl={notificationAnchorEl}
                    open={Boolean(notificationAnchorEl)}
                    onClose={handleNotificationMenuClose}
                    onNotificationsUpdate={handleNotificationsUpdate}
                  />
                  
                  {/* {notifications.filter(n => !n.isRead).length > 0 && (
                    <Button size="small">Mark all as read</Button>
                  )} */}
                  
                  <IconButton 
                    color="inherit"
                    onClick={handleMenuOpen}
                    sx={{ mx: 0.5 }}
                  >
                    <PersonIcon />
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