import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Chip,
  Alert
} from '@mui/material';
import { format } from 'date-fns';
import OrderService from '../services/OrderService';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types/order';

const RefundRequests: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [refundOrders, setRefundOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRefundRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await OrderService.getRefundRequests();
        setRefundOrders(response.data);
      } catch (err: any) {
        console.error('Error fetching refund requests:', err);
        if (err.response?.status === 403) {
          setError('Bạn không có quyền truy cập danh sách yêu cầu đổi/trả hàng. Vui lòng liên hệ quản trị viên.');
        } else {
          setError(err.response?.data?.message || 'Không thể tải danh sách yêu cầu đổi/trả hàng');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchRefundRequests();
    } else {
      navigate('/login', { state: { from: '/refund-requests' } });
    }
  }, [isAuthenticated, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'warning';
      case 'REVIEWING':
        return 'info';
      case 'APPROVED':
        return 'success';
      case 'COMPLETED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRefundStatusTranslation = (status: string): string => {
    switch (status) {
      case 'REQUESTED':
        return 'Đang chờ xử lý';
      case 'REVIEWING':
        return 'Đang xem xét';
      case 'APPROVED':
        return 'Đã chấp thuận';
      case 'COMPLETED':
        return 'Đã hoàn tất';
      case 'REJECTED':
        return 'Bị từ chối';
      default:
        return status;
    }
  };

  const handleViewOrderDetails = (orderId: number) => {
    navigate(`/orders/${orderId}`);
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box display="flex" justifyContent="center">
          <Button variant="contained" onClick={() => navigate('/')}>
            Quay lại trang chủ
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box my={4} mx={2}>
      <Typography variant="h4" gutterBottom>
        Yêu cầu đổi/trả hàng
      </Typography>

      {refundOrders.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Bạn chưa có yêu cầu đổi/trả hàng nào.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã đơn hàng</TableCell>
                <TableCell>Ngày yêu cầu</TableCell>
                <TableCell>Tổng tiền</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {refundOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>
                    {order.refundRequest && (order.refundRequest as any).createdAt ? format(new Date((order.refundRequest as any).createdAt), 'PPP') : 'N/A'}
                  </TableCell>
                  <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>
                    {order.refundStatus && (
                      <Chip
                        label={getRefundStatusTranslation(order.refundStatus)}
                        color={getRefundStatusColor(order.refundStatus)}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewOrderDetails(order.id)}
                    >
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box display="flex" justifyContent="flex-start" mt={3}>
        <Button variant="outlined" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </Box>
    </Box>
  );
};

export default RefundRequests;
