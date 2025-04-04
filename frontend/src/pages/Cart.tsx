import React, { useState, useEffect } from 'react';
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
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingBasket as ShoppingBasketIcon,
  ArrowForward as ArrowForwardIcon,
  LocalOffer as CouponIcon
} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchaseAmount: number;
  expiryDate: string;
}

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [couponCode, setCouponCode] = useState('');
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserCoupons();
    }
  }, [isAuthenticated]);

  const fetchUserCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coupons/my-coupons');
      setUserCoupons(response.data);
      if (response.data.length > 0) {
        setCouponSuccess(`Bạn có ${response.data.length} mã giảm giá mới từ admin!`);
      }
    } catch (error) {
      console.error('Error fetching user coupons:', error);
      setCouponError('Không thể tải mã giảm giá');
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuantityChange = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
  };
  
  const handleRemove = (id: string) => {
    removeFromCart(id);
  };
  
  const handleApplyCoupon = async () => {
    if (!selectedCoupon) {
      setCouponError('Vui lòng chọn mã giảm giá');
      setCouponSuccess('');
      return;
    }

    try {
      const response = await api.post('/coupons/verify', {
        code: selectedCoupon,
        orderAmount: calculateSubtotal()
      });

      const selectedCouponObj = userCoupons.find(c => c.code === selectedCoupon);
      
      if (!selectedCouponObj) {
        setCouponError('Mã giảm giá không hợp lệ');
        setCouponSuccess('');
        return;
      }

      // Xử lý theo loại giảm giá
      if (selectedCouponObj.discountType === 'PERCENTAGE') {
        setDiscount(selectedCouponObj.discountValue / 100);
      } else {
        // FIXED_AMOUNT - tính ra phần trăm tương đương
        const subtotal = calculateSubtotal();
        if (subtotal > 0) {
          setDiscount(Math.min(selectedCouponObj.discountValue / subtotal, 1));
        }
      }

      setCouponCode(selectedCoupon);
      setCouponSuccess(`Áp dụng mã giảm giá thành công!`);
      setCouponError('');
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      setCouponError(error.response?.data?.message || 'Không thể áp dụng mã giảm giá');
      setCouponSuccess('');
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
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
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
            
            {/* Coupon Code Selection */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                <CouponIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Mã giảm giá của bạn
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                
                <Select
                  labelId="coupon-select-label"
                  value={selectedCoupon}
                  onChange={(e) => setSelectedCoupon(e.target.value as string)}
                  label="Chọn mã giảm giá"
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>Không sử dụng mã giảm giá</em>
                  </MenuItem>
                  {userCoupons.map((coupon) => (
                    <MenuItem key={coupon.id} value={coupon.code}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2">{coupon.description}</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Chip 
                            size="small" 
                            label={coupon.discountType === 'PERCENTAGE' 
                              ? `Giảm ${coupon.discountValue}%` 
                              : `Giảm ${formatCurrency(coupon.discountValue)}`} 
                            color="primary" 
                            variant="outlined" 
                          />
                          <Typography variant="caption" color="text.secondary">
                            HSD: {formatDate(coupon.expiryDate)}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button 
                variant="outlined" 
                onClick={handleApplyCoupon}
                fullWidth
              >
                Áp dụng mã giảm giá
              </Button>
              
              {couponError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {couponError}
                </Alert>
              )}
              
              {couponSuccess && (
                <Alert severity="success" sx={{ mt: 1 }}>
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