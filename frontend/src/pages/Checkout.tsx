import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Step,
  Stepper,
  StepLabel,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  FormHelperText
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import OrderService from '../services/OrderService';
import {
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

interface DeliveryInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

interface ErrorState {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  paymentMethod?: string;
}

const steps = ['Thông tin giao hàng', 'Phương thức thanh toán', 'Xác nhận đơn hàng'];

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart, getCartTotal } = useCart();
  const theme = useTheme();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    fullName: user?.fullName || '',
    phone: user?.phoneNumber || '',
    address: user?.address || '',
    city: '',
    zipCode: '',
    country: 'Vietnam',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState<ErrorState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [navigate, items]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value);
    if (errors.paymentMethod) {
      setErrors(prev => ({ ...prev, paymentMethod: undefined }));
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateDeliveryInfo()) {
      return;
    }
    
    if (activeStep === 1 && !validatePayment()) {
      return;
    }
    
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (activeStep === 0) {
      navigate('/cart');
    } else {
      setActiveStep(prev => prev - 1);
    }
  };

  const validateDeliveryInfo = (): boolean => {
    const newErrors: ErrorState = {};
    let isValid = true;
    
    if (!deliveryInfo.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
      isValid = false;
    }
    
    if (!deliveryInfo.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
      isValid = false;
    } else if (!/^\d{10,11}$/.test(deliveryInfo.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
      isValid = false;
    }
    
    if (!deliveryInfo.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
      isValid = false;
    }
    
    if (!deliveryInfo.city.trim()) {
      newErrors.city = 'Vui lòng nhập thành phố';
      isValid = false;
    }
    
    if (!deliveryInfo.zipCode.trim()) {
      newErrors.zipCode = 'Vui lòng nhập mã bưu điện';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const validatePayment = (): boolean => {
    const newErrors: ErrorState = {};
    let isValid = true;
    
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const getFullShippingAddress = () => {
    return `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.zipCode}`;
  };

  const handlePlaceOrder = async () => {
    try {
      setIsSubmitting(true);
      setOrderError(null);
      
      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        shippingAddress: getFullShippingAddress(),
        paymentMethod,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };
      
      const response = await OrderService.createOrder(orderData);
      
      // Order successful - clear cart and navigate to success page
      clearCart();
      navigate('/order-success', { state: { orderId: response.data.id } });
      
    } catch (err: any) {
      console.error('Error placing order:', err);
      setOrderError(err.response?.data?.message || 'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Họ tên"
                name="fullName"
                value={deliveryInfo.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Số điện thoại"
                name="phone"
                value={deliveryInfo.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Địa chỉ"
                name="address"
                value={deliveryInfo.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Thành phố"
                name="city"
                value={deliveryInfo.city}
                onChange={handleChange}
                error={!!errors.city}
                helperText={errors.city}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Mã bưu điện"
                name="zipCode"
                value={deliveryInfo.zipCode}
                onChange={handleChange}
                error={!!errors.zipCode}
                helperText={errors.zipCode}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="country-label">Quốc gia</InputLabel>
                <Select
                  labelId="country-label"
                  id="country"
                  name="country"
                  value={deliveryInfo.country}
                  label="Quốc gia"
                  onChange={(e) => setDeliveryInfo(prev => ({ ...prev, country: e.target.value }))}
                >
                  <MenuItem value="Vietnam">Việt Nam</MenuItem>
                  <MenuItem value="USA">United States</MenuItem>
                  <MenuItem value="China">China</MenuItem>
                  <MenuItem value="Japan">Japan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <FormControl component="fieldset" error={!!errors.paymentMethod} sx={{ width: '100%' }}>
            <RadioGroup
              aria-label="payment-method"
              name="paymentMethod"
              value={paymentMethod}
              onChange={handlePaymentChange}
            >
              <Paper sx={{ mb: 2, p: 2, border: paymentMethod === 'cod' ? `1px solid ${theme.palette.primary.main}` : 'none' }}>
                <FormControlLabel 
                  value="cod" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="subtitle1">Thanh toán khi nhận hàng (COD)</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Thanh toán bằng tiền mặt khi nhận hàng
                      </Typography>
                    </Box>
                  } 
                />
              </Paper>
              
              <Paper sx={{ mb: 2, p: 2, border: paymentMethod === 'bank' ? `1px solid ${theme.palette.primary.main}` : 'none' }}>
                <FormControlLabel 
                  value="bank" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="subtitle1">Chuyển khoản ngân hàng</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Chuyển khoản qua ngân hàng, ví điện tử
                      </Typography>
                    </Box>
                  } 
                />
              </Paper>
              
              <Paper sx={{ mb: 2, p: 2, border: paymentMethod === 'credit' ? `1px solid ${theme.palette.primary.main}` : 'none' }}>
                <FormControlLabel 
                  value="credit" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="subtitle1">Thẻ tín dụng/Ghi nợ</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Thanh toán an toàn với các thẻ Visa, Mastercard, JCB
                      </Typography>
                    </Box>
                  } 
                />
              </Paper>
            </RadioGroup>
            {errors.paymentMethod && (
              <FormHelperText>{errors.paymentMethod}</FormHelperText>
            )}
          </FormControl>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Thông tin đơn hàng</Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Thông tin giao hàng</Typography>
                <Typography variant="body1">
                  {deliveryInfo.fullName} - {deliveryInfo.phone}
                </Typography>
                <Typography variant="body1">
                  {getFullShippingAddress()}
                </Typography>
                <Typography variant="body1">
                  {deliveryInfo.country}
                </Typography>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>Phương thức thanh toán</Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="body1">
                  {paymentMethod === 'cod' && 'Thanh toán khi nhận hàng (COD)'}
                  {paymentMethod === 'bank' && 'Chuyển khoản ngân hàng'}
                  {paymentMethod === 'credit' && 'Thẻ tín dụng/Ghi nợ'}
                </Typography>
              </Paper>
              
              <Typography variant="subtitle1" gutterBottom>Sản phẩm đã chọn</Typography>
              <Paper sx={{ p: 2, mb: 3 }}>
                {items.map((item) => (
                  <Box key={item.id} sx={{ py: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center">
                      <Box
                        component="img"
                        src={item.imageUrl || 'https://via.placeholder.com/50'}
                        alt={item.name}
                        sx={{ width: 50, height: 50, objectFit: 'contain', mr: 2 }}
                      />
                      <Typography variant="body1">
                        {item.name} x {item.quantity}
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">Tổng tiền</Typography>
                  <Typography variant="h6" fontWeight="bold" color="error">
                    {formatCurrency(getCartTotal())}
                  </Typography>
                </Box>
              </Paper>
              
              {orderError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {orderError}
                </Alert>
              )}
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    
    // Xử lý thanh toán ở đây
    handleNext();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Thanh toán
      </Typography>
      
      {Object.values(errors).some(error => !!error) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.paymentMethod || errors.fullName || errors.phone || errors.address || errors.city || errors.zipCode || errors.country}
        </Alert>
      )}
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button 
                disabled={activeStep === 0} 
                onClick={handleBack}
                startIcon={<ArrowBackIcon />}
              >
                Quay lại
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting}
                  sx={{ 
                    py: 1,
                    px: 3,
                    bgcolor: theme.palette.success.main,
                    '&:hover': {
                      bgcolor: theme.palette.success.dark,
                    }
                  }}
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleCheckout}
                  sx={{ py: 1, px: 3 }}
                >
                  Tiến hành thanh toán
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tóm tắt đơn hàng
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {items.map((item) => (
              <Box key={item.id} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {item.name} x {item.quantity}
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(item.price * item.quantity)}
                </Typography>
              </Box>
            ))}
            
            <Divider sx={{ my: 2 }} />
            
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Tạm tính</Typography>
              <Typography>{formatCurrency(getCartTotal())}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography>Phí giao hàng</Typography>
              <Typography>Free</Typography>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Tổng thanh toán</Typography>
              <Typography variant="h6" fontWeight="bold" color="error">
                {formatCurrency(getCartTotal())}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={success || error}
      />
    </Container>
  );
};

export default Checkout; 