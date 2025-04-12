import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';
import OrderService from '../services/OrderService';
import NotificationService from '../services/NotificationService';
import { refreshHeaderNotifications } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Order } from '../types/order';

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { refreshNotifications } = useNotification();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<boolean>(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;
        
        const response = await OrderService.getOrderById(id);
        setOrder(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrder();
    } else {
      navigate('/login', { state: { from: `/orders/${id}` } });
    }
  }, [id, isAuthenticated, navigate]);

  const handleCancelOrder = async () => {
    try {
      if (!id) return;
      
      // First, cancel the order
      await OrderService.cancelOrder(Number(id));

      // Hoàn tiền vào tài khoản
      try {
        await OrderService.refundOrder(Number(id));
        setRefundSuccess(true);
      } catch (refundErr) {
        console.error('Error refunding order:', refundErr);
        // Vẫn tiếp tục với việc hủy đơn hàng ngay cả khi hoàn tiền thất bại
      }
      
      // After successful order cancellation, use multiple approaches to refresh notifications
      console.log("Order cancelled successfully, refreshing notifications...");
      
      // 1. Call the global refresh function from Header component
      refreshHeaderNotifications();
      
      // 2. Call the context refresh function (most reliable approach)
      await refreshNotifications();
      
      // 3. Direct service call with small delay as a fallback
      setTimeout(() => {
        try {
          NotificationService.getNotifications()
            .then(response => {
              console.log("Manually fetched notifications after cancel:", response.data.length);
            })
            .catch(error => {
              console.error("Error manually fetching notifications:", error);
            });
        } catch (err) {
          console.error('Failed manual notification refresh:', err);
        }
      }, 300);
      
      // Refresh order data
      const response = await OrderService.getOrderById(id);
      setOrder(response.data);
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box my={4}>
        <Typography color="error" align="center">
          {error}
        </Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" onClick={() => navigate('/orders')}>
            Quay lại danh sách đơn hàng
          </Button>
        </Box>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box my={4}>
        <Typography align="center">Không tìm thấy đơn hàng</Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" onClick={() => navigate('/orders')}>
            Quay lại danh sách đơn hàng
          </Button>
        </Box>
      </Box>
    );
  }

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

  return (
    <Box my={4}>
      {refundSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Đơn hàng đã được hủy và số tiền đã được hoàn trả vào tài khoản của bạn.
        </Alert>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Đơn hàng #{order.id}</Typography>
        <Chip
          label={order.status}
          color={getStatusColor(order.status)}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sản phẩm đã đặt
            </Typography>
            <List>
              {order.orderItems?.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemText
                    primary={item.productName}
                    secondary={`Số lượng: ${item.quantity}`}
                  />
                  <Typography>
                    {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>

          {order.status === 'PENDING' && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                color="error"
                onClick={handleCancelOrder}
              >
                Hủy đơn hàng
              </Button>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="body1">Ngày đặt:</Typography>
                <Typography variant="body1">
                  {format(new Date(order.createdAt), 'PPP')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="body1">Phương thức thanh toán:</Typography>
                <Typography variant="body1">{order.paymentMethod}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="body1">Trạng thái thanh toán:</Typography>
                <Chip
                  label={order.paymentStatus}
                  color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Địa chỉ giao hàng
              </Typography>
              <Typography variant="body2">{order.shippingAddress}</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="h6">Tổng cộng:</Typography>
                <Typography variant="h6">
                  {formatCurrency(order.totalAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-start" mt={3}>
        <Button variant="outlined" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </Box>
    </Box>
  );
};

export default OrderDetail; 