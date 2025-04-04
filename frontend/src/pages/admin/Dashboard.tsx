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
    stats: {},
    salesData: []
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
            <Typography variant="h5">{dashboardData.stats?.totalOrders || 0}</Typography>
            <Typography variant="subtitle1">Total Orders</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {dashboardData.stats?.pendingOrders || 0} pending
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
            <Typography variant="h5">{dashboardData.stats?.totalUsers || 0}</Typography>
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
            <Typography variant="h5">{dashboardData.stats?.totalProducts || 0}</Typography>
            <Typography variant="subtitle1">Total Products</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {dashboardData.stats?.outOfStockProducts || 0} out of stock
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
              ${(dashboardData.stats?.totalRevenue || 0).toFixed(2)}
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
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              <Divider sx={{ my: 1 }} />
              {Array.isArray(dashboardData.recentOrders) && dashboardData.recentOrders.length > 0 ? (
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
                          ${order.totalAmount ? parseFloat(order.totalAmount).toFixed(2) : '0.00'}
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
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No recent orders
                </Typography>
              )}
              <Button
                component={RouterLink}
                to="/admin/orders"
                size="small"
                sx={{ mt: 1 }}
              >
                View All Orders
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Products
              </Typography>
              <Divider sx={{ my: 1 }} />
              {Array.isArray(dashboardData.topProducts) && dashboardData.topProducts.length > 0 ? (
                dashboardData.topProducts.map((product: any) => (
                  <Box key={product.id} sx={{ mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={2}>
                        <Avatar
                          alt={product.name}
                          src={product.imageUrl}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" noWrap>
                          {product.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          ${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No product data available
                </Typography>
              )}
              <Button
                component={RouterLink}
                to="/admin/products"
                size="small"
                sx={{ mt: 1 }}
              >
                View All Products
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Report Section */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Sales Reports
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Revenue
                </Typography>
                <Box height={300} display="flex" justifyContent="center" alignItems="center">
                  {Array.isArray(dashboardData.salesData) && dashboardData.salesData.length > 0 ? (
                    <Typography>Chart would be displayed here</Typography>
                  ) : (
                    <Typography color="textSecondary">No sales data available</Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Status Distribution
                </Typography>
                <Box height={300} display="flex" justifyContent="center" alignItems="center">
                  <Typography>Pie chart would be displayed here</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard; 