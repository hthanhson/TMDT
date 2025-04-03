import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  IconButton,
  TextField,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingBasket as ShoppingBasketIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  
  // Danh sách mã giảm giá demo
  const validCoupons = [
    { code: "WELCOME10", discount: 0.1, message: "Giảm 10% cho đơn hàng" },
    { code: "SUMMER20", discount: 0.2, message: "Giảm 20% cho đơn hàng mùa hè" },
    { code: "FREESHIP", discount: 0.05, message: "Miễn phí vận chuyển - Giảm 5%" }
  ];
  
  const handleQuantityChange = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
  };
  
  const handleRemove = (id: string) => {
    removeFromCart(id);
  };
  
  const handleApplyCoupon = () => {
    // Reset trạng thái trước
    setCouponError(null);
    setCouponSuccess(null);
    
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }
    
    // Kiểm tra mã giảm giá
    const matchedCoupon = validCoupons.find(
      coupon => coupon.code.toLowerCase() === couponCode.trim().toLowerCase()
    );
    
    if (matchedCoupon) {
      setCouponSuccess(matchedCoupon.message);
      setDiscount(matchedCoupon.discount);
    } else {
      setCouponError('Mã giảm giá không hợp lệ hoặc đã hết hạn');
      setDiscount(0);
    }
  };
  
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };
  
  const calculateDiscount = () => {
    return calculateSubtotal() * discount;
  };
  
  const calculateTotal = () => {
    // Áp dụng giảm giá
    return calculateSubtotal() - calculateDiscount();
  };
  
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };
  
  if (items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ShoppingBasketIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>Giỏ hàng của bạn đang trống</Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Thêm sản phẩm vào giỏ hàng để tiến hành thanh toán.
          </Typography>
          <Button 
            variant="contained" 
            component={Link} 
            to="/products"
            sx={{ mt: 2 }}
          >
            Tiếp tục mua sắm
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Giỏ hàng của bạn
      </Typography>
      
      <Grid container spacing={4}>
        {/* Cart Items */}
        <Grid item xs={12} lg={8}>
          <TableContainer component={Paper} sx={{ mb: { xs: 4, lg: 0 } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sản phẩm</TableCell>
                  <TableCell align="center">Giá</TableCell>
                  <TableCell align="center">Số lượng</TableCell>
                  <TableCell align="center">Tổng tiền</TableCell>
                  <TableCell align="center">Xóa</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Box
                          component="img"
                          src={item.imageUrl || 'https://via.placeholder.com/80'}
                          alt={item.name}
                          sx={{ width: 80, height: 80, objectFit: 'contain', mr: 2 }}
                        />
                        <Typography variant="body1">{item.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        <IconButton 
                          size="small" 
                          onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <TextField
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value > 0) {
                              handleQuantityChange(item.id, value);
                            }
                          }}
                          inputProps={{ min: 1, style: { textAlign: 'center', width: '40px' } }}
                          variant="standard"
                          sx={{ mx: 1 }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight="bold">
                        {formatCurrency(item.price * item.quantity)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        onClick={() => handleRemove(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        {/* Order Summary */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tóm tắt đơn hàng
            </Typography>
            
            {/* Coupon Code Input */}
            <Box mb={3}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TextField 
                  label="Mã giảm giá" 
                  size="small" 
                  fullWidth
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={handleApplyCoupon}
                >
                  Áp dụng
                </Button>
              </Box>
              
              {couponError && (
                <Alert severity="error" sx={{ mb: 1 }}>
                  {couponError}
                </Alert>
              )}
              
              {couponSuccess && (
                <Alert severity="success" sx={{ mb: 1 }}>
                  {couponSuccess}
                </Alert>
              )}
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body1">Tạm tính:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(calculateSubtotal())}
                </Typography>
              </Box>
              
              {discount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body1">Giảm giá:</Typography>
                  <Typography variant="body1" color="error.main">
                    -{formatCurrency(calculateDiscount())}
                  </Typography>
                </Box>
              )}
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body1">Phí giao hàng:</Typography>
                <Typography variant="body1">Free</Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Tổng tiền:</Typography>
                <Typography variant="h6" fontWeight="bold" color="error">
                  {formatCurrency(calculateTotal())}
                </Typography>
              </Box>
            </Box>
            
            {/* Checkout Button */}
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              endIcon={<ArrowForwardIcon />}
              onClick={handleCheckout}
              sx={{ 
                py: 1.5,
                bgcolor: theme.palette.success.main,
                '&:hover': {
                  bgcolor: theme.palette.success.dark,
                }
              }}
            >
              Tiến hành thanh toán
            </Button>
            
            <Button
              variant="text"
              component={Link}
              to="/products"
              sx={{ mt: 2, display: 'block', textAlign: 'center', width: '100%' }}
            >
              Tiếp tục mua sắm
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart; 