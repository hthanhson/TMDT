import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  Person as UserIcon,
  Inventory as ProductIcon,
  Paid as RevenueIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  LocalOffer as PromotionIcon
} from '@mui/icons-material';
import AdminService from '../../services/AdminService';
import NotificationService from '../../services/NotificationService';
import { Notification } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>({
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    outOfStockProducts: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationLoading, setNotificationLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsResponse = await AdminService.getDashboardStats();
      const salesResponse = await AdminService.getSalesData();
      const topProductsResponse = await AdminService.getTopProducts(5);
      const recentOrdersResponse = await AdminService.getRecentOrders(5);
      
      setDashboardData({
        stats: statsResponse.data,
        salesData: salesResponse.data,
        topProducts: topProductsResponse.data,
        recentOrders: recentOrdersResponse.data
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);
      const response = await NotificationService.getNotifications();
      setNotifications(response.data);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotificationLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <OrderIcon color="primary" />;
      case 'PROMOTION':
        return <PromotionIcon color="secondary" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch (e) {
      return 'mới đây';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bảng điều khiển quản trị
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Order Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <OrderIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">{dashboardData.totalOrders}</Typography>
            <Typography variant="subtitle1">Total Orders</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {dashboardData.pendingOrders} pending
            </Typography>
          </Paper>
        </Grid>

        {/* User Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'success.contrastText',
            }}
          >
            <UserIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">{dashboardData.totalUsers}</Typography>
            <Typography variant="subtitle1">Total Users</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Active accounts
            </Typography>
          </Paper>
        </Grid>

        {/* Product Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
            }}
          >
            <ProductIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">{dashboardData.totalProducts}</Typography>
            <Typography variant="subtitle1">Total Products</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {dashboardData.outOfStockProducts} out of stock
            </Typography>
          </Paper>
        </Grid>

        {/* Revenue Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'info.light',
              color: 'info.contrastText',
            }}
          >
            <RevenueIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">
              ${dashboardData.totalRevenue.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">Total Revenue</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              All time sales
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Divider sx={{ my: 1 }} />
              {dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order: any) => (
                  <Box key={order.id} sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">
                          Order #{order.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          ${parseFloat(order.totalAmount).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              order.status === 'DELIVERED'
                                ? 'success.main'
                                : order.status === 'CANCELLED'
                                ? 'error.main'
                                : 'warning.main',
                          }}
                        >
                          {order.status}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No recent orders
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={RouterLink}
                to="/admin/orders"
                sx={{ ml: 'auto' }}
              >
                View All Orders
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Selling Products
              </Typography>
              <Divider sx={{ my: 1 }} />
              {dashboardData.topProducts.length > 0 ? (
                dashboardData.topProducts.map((product: any) => (
                  <Box key={product.id} sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">{product.name}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="textSecondary">
                          ${parseFloat(product.price).toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" color="textSecondary">
                          {product.soldCount} sold
                        </Typography>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 1 }} />
                  </Box>
                ))
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No products data
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={RouterLink}
                to="/admin/products"
                sx={{ ml: 'auto' }}
              >
                Manage Products
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Badge badgeContent={notifications.filter(n => !n.isRead).length} color="error" sx={{ mr: 1 }}>
                  <NotificationsIcon color="primary" />
                </Badge>
                <Typography variant="h6">
                  Thông báo gần đây
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              
              {notificationLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={30} />
                </Box>
              ) : notifications.length === 0 ? (
                <Box textAlign="center" py={2}>
                  <Typography variant="body2" color="textSecondary">
                    Không có thông báo nào
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {notifications.slice(0, 5).map((notification) => (
                    <ListItem 
                      key={notification.id}
                      sx={{
                        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                        mb: 1,
                        borderRadius: 1
                      }}
                    >
                      <ListItemIcon>
                        <Avatar 
                          sx={{ 
                            bgcolor: notification.isRead ? 'grey.300' : 'primary.light',
                            width: 36,
                            height: 36
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.message}
                        secondary={formatTime(notification.createdAt)}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: notification.isRead ? 'normal' : 'bold'
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button
                size="small"
                component={RouterLink}
                to="/admin/notifications"
                sx={{ ml: 'auto' }}
              >
                Xem tất cả
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 