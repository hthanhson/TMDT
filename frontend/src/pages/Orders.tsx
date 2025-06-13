import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductImageUrl, FALLBACK_IMAGE } from '../utils/imageHelpers';
import {
  Container,
  Typography,
  Box,
  Divider,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Timeline, 
  TimelineItem, 
  TimelineSeparator, 
  TimelineConnector, 
  TimelineContent, 
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import { 
  ShoppingBag, 
  LocalShipping, 
  CheckCircle, 
  Cancel, 
  Receipt,
  PaymentOutlined
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import OrderService from '../services/OrderService';
import { Order } from '../types/order';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cancelledMessage, setCancelledMessage] = useState('');
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await OrderService.getOrders();
        console.log('Fetched orders:', response.data);
        setOrders(response.data);
        
        response.data.forEach((order: Order) => {
          const orderItemsWithValidIds = order.orderItems.map(item => {
            if (!item.product.id) {
              console.warn(`Order ${order.id} has item with undefined productId`, item);
            }
            return {
              id: item.id,
              productId: item.product.id || 'undefined',
              productName: item.productName,
              imageUrl: item.product.imageUrl ? getProductImageUrl(item.product.id) : FALLBACK_IMAGE,
            };
          });
          console.log(`Order ${order.id} items:`, orderItemsWithValidIds);
        });
        
        const successfulOrders = response.data.filter(order => order.status === 'DELIVERED');
        if (successfulOrders.length > 0) {
          setSuccessMessage(`Bạn có ${successfulOrders.length} đơn hàng đã giao thành công!`);
        } else {
          setSuccessMessage('');
        }
        
        const cancelledOrders = response.data.filter(order => order.status === 'CANCELLED');
        if (cancelledOrders.length > 0) {
          setCancelledMessage(`Bạn có ${cancelledOrders.length} đơn hàng đã bị hủy`);
        } else {
          setCancelledMessage('');
        }
        
        setError('');
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user, navigate]);
  
  const getStatusColor = (status: Order['status'], refundStatus?: string) => {
    if (refundStatus === 'APPROVED' || refundStatus === 'COMPLETED') {
      return 'secondary';
    }
    
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
      case 'RETURNED':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  const getStatusIcon = (status: Order['status'], refundStatus?: string) => {
    if (refundStatus === 'APPROVED' || refundStatus === 'COMPLETED') {
      return <LocalShipping />;
    }
    
    switch (status) {
      case 'PENDING':
        return <Receipt />;
      case 'PROCESSING':
        return <PaymentOutlined />;
      case 'SHIPPED':
        return <LocalShipping />;
      case 'DELIVERED':
        return <CheckCircle />;
      case 'CANCELLED':
        return <Cancel />;
      case 'RETURNED':
        return <LocalShipping />;
      default:
        return <ShoppingBag />;
    }
  };
    const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd/MM/yyyy');
  };
  
  const getStatusTranslation = (status: string, refundStatus?: string): string => {
    if (refundStatus === 'APPROVED' || refundStatus === 'COMPLETED') {
      return 'Đã trả hàng & hoàn tiền';
    }
    
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PROCESSING':
        return 'Sẵn sàng giao hàng';
      case 'READY_TO_SHIP':
        return 'Sẵn sàng giao hàng';
      case 'SHIPPED':
        return 'Đang giao hàng';
      case 'IN_TRANSIT':
        return 'Đang vận chuyển';
      case 'ARRIVED_AT_STATION':
        return 'Đã đến trạm';
      case 'OUT_FOR_DELIVERY':
        return 'Đang giao hàng';
      case 'DELIVERED':
        return 'Đã giao hàng';
      case 'COMPLETED':
        return 'Hoàn tất';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'RETURNED':
        return 'Đã trả hàng & hoàn tiền';
      default:
        return status;
    }
  };
  
  const renderOrderTimeline = (order: Order) => {
    if (order.refundStatus === 'APPROVED' || order.refundStatus === 'COMPLETED') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <LocalShipping color="secondary" sx={{ mr: 1 }} />
          <Typography color="secondary" variant="body2">
            Đơn hàng đã được hoàn trả và hoàn tiền
          </Typography>
        </Box>
      );
    }
    
    if (order.status === 'CANCELLED') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
          <Cancel color="error" sx={{ mr: 1 }} />
          <Typography color="error" variant="body2">
            Đơn hàng này đã bị hủy
          </Typography>
        </Box>
      );
    }
    
    const steps = [
      { status: 'PENDING', label: 'Đơn hàng đã đặt', completed: true },
      { status: 'PROCESSING', label: 'Sẵn sàng giao hàng', completed: ['READY_TO_SHIP', 'DELIVERED','OUT_FOR_DELIVERY'].includes(order.status) },
      { status: 'SHIPPED', label: 'Đang giao hàng', completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) },
      { status: 'DELIVERED', label: 'Đã giao hàng', completed: order.status === 'DELIVERED' }
    ];
    
    return (
      <Timeline position="alternate" sx={{ py: 0, my: 0 }}>
        {steps.map((step, index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.2 }}>
              {step.completed && <Typography variant="caption">{
                index === 0 ? formatDate(order.createdAt) : ''
              }</Typography>}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={step.completed ? 'primary' : 'grey'} variant={step.completed ? 'filled' : 'outlined'}>
                {getStatusIcon(step.status as Order['status'], order.refundStatus)}
              </TimelineDot>
              {index < steps.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>{step.label}</TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Đơn hàng của tôi
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      {cancelledMessage && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {cancelledMessage}
        </Alert>
      )}
      
      
      {orders.length === 0 ? (
        <Box textAlign="center" py={6}>
          <ShoppingBag sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Bạn chưa đặt đơn hàng nào
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Bắt đầu mua sắm
          </Button>
        </Box>
      ) : (
        <Box>
          {orders.map((order) => (
            <Card key={order.id} variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1">
                    Đơn hàng #{order.id}
                  </Typography>
                  <Chip
                    label={getStatusTranslation(order.status, order.refundStatus)}
                    color={getStatusColor(order.status, order.refundStatus)}
                    size="small"
                  />
                </Box>
                
                <Typography variant="caption" color="textSecondary">
                  Đặt hàng vào {formatDate(order.createdAt)}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  {order.orderItems.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                      <Box 
                        display="flex" 
                        alignItems="center"
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <Box sx={{ position: 'relative', mr: 2 }}>
                          <img
                            src={getProductImageUrl(item.product.id)}
                            alt={item.productName}
                            onError={(e: any) => (e.currentTarget.src = FALLBACK_IMAGE)}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography 
                            variant="body2" 
                            noWrap 
                            sx={{ 
                              fontWeight: 500,
                              mb: 0.5 
                            }}
                          >
                            {item.productName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.quantity} x {formatCurrency(item.price)}
                          </Typography>
                          {/* {process.env.NODE_ENV === 'development' && (
                            <Typography variant="caption" display="block" color="primary">
                              ID: {item.product.id}
                            </Typography>
                          )} */}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                {renderOrderTimeline(order)}
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Địa chỉ giao hàng
                    </Typography>
                    <Typography variant="body2">
                      {order.shippingAddress}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" color="textSecondary">
                      Tổng tiền
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(order.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
                
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    Xem chi tiết
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Container>
  );
};

export default Orders;