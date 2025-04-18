import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Grid,
  useTheme
} from '@mui/material';
import { CheckCircle, Home, List } from '@mui/icons-material';
import OrderService from '../services/OrderService';
import { useCart } from '../contexts/CartContext';

const PaySuccess: React.FC = () => {
  const [hasCreatedOrder, setHasCreatedOrder] = useState(false); 
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { clearCart } = useCart();
  const isCreatingOrder = useRef(false); // ✅ FIXED: không bị reset
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const createOrderFromLocalStorage = async () => {
      if (isCreatingOrder.current) return; // ✅ Kiểm tra flag đúng cách
      isCreatingOrder.current = true;

      try {
        const urlParams = new URLSearchParams(location.search);
        const paymentStatus = urlParams.get('vnp_ResponseCode');

        const pendingOrder = localStorage.getItem('pendingOrder');
        const orderAlreadyCreated = localStorage.getItem('orderCreated');

        if (paymentStatus === '00' && pendingOrder && !orderAlreadyCreated) {
          const orderData = JSON.parse(pendingOrder);

          const response = await OrderService.createOrder(orderData);

          setHasCreatedOrder(true);
          setOrderId(response.data.id.toString());

          localStorage.setItem('orderCreated', 'true');
          localStorage.removeItem('pendingOrder');
          console.log("✅ Order created:", response.data.id.toString());
        } else if (orderAlreadyCreated) {
          setError('Đơn hàng này đã được xử lý.');
        } else {
          setError('Không tìm thấy thông tin đơn hàng hoặc thanh toán không hợp lệ.');
        }

      } catch (err) {
        console.error('❌ Error creating order:', err);
        setError('Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng liên hệ hỗ trợ.');
      } finally {
        setIsLoading(false);
      }
    };

    createOrderFromLocalStorage();
  }, [location.search]);

  useEffect(() => {
    if (orderId) {
      clearCart();
      setTimeout(() => {
        localStorage.removeItem('orderCreated');
        isCreatingOrder.current = false; // ✅ Reset lại flag cho đơn tiếp theo
      }, 3000);
    }
  }, [orderId, clearCart]);
  

  useEffect(() => {
    if (orderId) {
      clearCart();
      // ❌ Optionally reset để không ảnh hưởng đơn sau
      setTimeout(() => {
        localStorage.removeItem('orderCreated');
      }, 3000); // 3s sau khi đã xử lý xong
    }
  }, [orderId, clearCart]);
  

  // ✅ Đang loading
  if (isLoading) return null;

  // ❌ Có lỗi
  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: `1px solid ${theme.palette.error.light}`
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom color="error.main" fontWeight="bold">
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/"
            startIcon={<Home />}
          >
            Quay lại trang chủ
          </Button>
        </Paper>
      </Container>
    );
  }

  // ✅ Hiển thị nếu có orderId
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 2,
          border: `1px solid ${theme.palette.success.light}`
        }}
      >
        <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom color="success.main" fontWeight="bold">
          Đặt hàng thành công!
        </Typography>
        <Typography variant="h6" gutterBottom>
          Mã đơn hàng: #{orderId}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
          Cảm ơn bạn đã mua hàng! Chúng tôi đã nhận được đơn hàng của bạn và đang xử lý.
          Bạn sẽ nhận được email xác nhận đơn hàng trong thời gian sớm nhất.
        </Typography>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ my: 4 }}>
          <Typography variant="h6" gutterBottom>
            Bước tiếp theo
          </Typography>
          <Typography variant="body1" paragraph>
            Bạn có thể theo dõi trạng thái đơn hàng trong trang "Đơn hàng của tôi".
            Nếu có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với dịch vụ khách hàng của chúng tôi.
          </Typography>
        </Box>
        <Grid container spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/orders"
              startIcon={<List />}
            >
              Xem đơn hàng
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              component={Link}
              to="/"
              startIcon={<Home />}
            >
              Tiếp tục mua sắm
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default PaySuccess;
