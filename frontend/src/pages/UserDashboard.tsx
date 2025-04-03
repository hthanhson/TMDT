import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as DeliveredIcon,
  Loyalty as PointsIcon,
  Money as WalletIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import OrderService from '../services/OrderService';

interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  recentOrders: Array<{
    id: number;
    createdAt: string;
    status: string;
    totalAmount: number;
  }>;
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<OrderSummary>({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await OrderService.getOrderSummary();
        setOrderData(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching order data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [user, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Navigation buttons */}
      <Box display="flex" gap={2} mb={4}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/orders')}
        >
          My Orders
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={() => navigate('/wishlist')}
        >
          My Wishlist
        </Button>
        <Button 
          variant="contained" 
          color="info" 
          onClick={() => navigate('/notifications')}
        >
          Notifications
          {orderData.pendingOrders > 0 && (
            <Chip 
              label={orderData.pendingOrders} 
              color="error" 
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Button>
        {user?.roles?.includes('ROLE_ADMIN') && (
          <Button 
            variant="contained" 
            color="warning" 
            onClick={() => navigate('/admin/dashboard')}
          >
            Admin Dashboard
          </Button>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Orders */}
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
            <Typography variant="h5">{orderData.totalOrders}</Typography>
            <Typography variant="subtitle1">Total Orders</Typography>
          </Paper>
        </Grid>

        {/* Pending Orders */}
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
            <ShippingIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">{orderData.pendingOrders}</Typography>
            <Typography variant="subtitle1">Pending Orders</Typography>
          </Paper>
        </Grid>

        {/* Delivered Orders */}
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
            <DeliveredIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">{orderData.deliveredOrders}</Typography>
            <Typography variant="subtitle1">Delivered Orders</Typography>
          </Paper>
        </Grid>

        {/* Total Spent */}
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
            <WalletIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">
              ${orderData.totalSpent.toFixed(2)}
            </Typography>
            <Typography variant="subtitle1">Total Spent</Typography>
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
              {orderData.recentOrders.length > 0 ? (
                <List>
                  {orderData.recentOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <ListItem
                        button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        sx={{ px: 1 }}
                      >
                        <ListItemText
                          primary={`Order #${order.id}`}
                          secondary={formatDate(order.createdAt)}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 2 }}>
                            ${order.totalAmount.toFixed(2)}
                          </Typography>
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status)}
                            size="small"
                          />
                        </Box>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center" sx={{ py: 2 }}>
                  No orders yet
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={() => navigate('/orders')}
                sx={{ ml: 'auto' }}
              >
                View All Orders
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Loyalty Points */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Loyalty Points
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <PointsIcon sx={{ fontSize: 48, mb: 1, color: 'secondary.main' }} />
                <Typography variant="h4" color="secondary.main">
                  {user?.points || 0}
                </Typography>
                <Typography variant="subtitle1">Available Points</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  Use your points to get discounts on your next purchases.
                  Every 100 points equals $1 off your purchase.
                </Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button
                size="small"
                onClick={() => navigate('/profile')}
                sx={{ ml: 'auto' }}
              >
                Manage Profile
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserDashboard; 