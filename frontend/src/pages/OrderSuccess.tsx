import React, { useEffect } from 'react';
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
import { CheckCircle, ArrowForward, Home, List } from '@mui/icons-material';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const orderId = location.state?.orderId;

  useEffect(() => {
    // Redirect to home if accessed directly without an orderId
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  if (!orderId) {
    return null; // Won't render anything while redirecting
  }

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
        <CheckCircle 
          color="success" 
          sx={{ fontSize: 80, mb: 2 }} 
        />
        
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

export default OrderSuccess; 