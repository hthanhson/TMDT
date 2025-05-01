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
  FormHelperText,
  InputAdornment,
  Chip,
  List,
  ListItem
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import OrderService from '../services/OrderService';
import CouponService from '../services/CouponService';
import NotificationService from '../services/NotificationService';
import {
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
  LocalOffer as CouponIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { refreshHeaderNotifications } from '../components/Header';
import { useNotification } from '../contexts/NotificationContext';

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
  couponCode?: string;
}

interface CouponInfo {
  code: string;
  valid: boolean;
  discountAmount: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  message?: string;
}

interface Coupon {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchaseAmount: number;
  expiryDate: string;
}

const steps = ['Thông tin giao hàng', 'Phương thức thanh toán', 'Xác nhận đơn hàng'];

const Checkout: React.FC = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  const { refreshNotifications } = useNotification();
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
  
  const [couponCode, setCouponCode] = useState('');
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  const [userCoupons, setUserCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
    
    if (user) {
      fetchUserCoupons();
    }
  }, [navigate, items, user]);

  const fetchUserCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const response = await CouponService.getMyCoupons();
      setUserCoupons(response.data);
    } catch (error) {
      console.error('Error fetching user coupons:', error);
      setError('Không thể tải mã giảm giá');
      setOpenSnackbar(true);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeliveryInfo(prev => ({ ...prev, [name]: value }));
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

  const handleCouponChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponCode(e.target.value);
    if (couponInfo) {
      setCouponInfo(null);
    }
    if (errors.couponCode) {
      setErrors(prev => ({ ...prev, couponCode: undefined }));
    }
  };

  const handleCouponSelection = (e: any) => {
    const selectedValue = e.target.value as string;
    setSelectedCoupon(selectedValue);
    
    if (selectedValue === '') {
      setCouponCode('');
      setCouponInfo(null);
      return;
    }
    
    setCouponCode(selectedValue);
  };

  const handleApplyCoupon = async () => {
    const codeToVerify = selectedCoupon || couponCode;
    
    if (!codeToVerify.trim()) {
      setErrors(prev => ({ ...prev, couponCode: 'Vui lòng nhập hoặc chọn mã giảm giá' }));
      return;
    }

    setValidatingCoupon(true);
    try {
      const response = await CouponService.verifyCoupon(codeToVerify, calculateSubtotal());
      
      if (response.data.valid && response.data.coupon) {
        const coupon = response.data.coupon;
        let discountAmount = 0;
        
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (calculateSubtotal() * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
          if (discountAmount > calculateSubtotal()) {
            discountAmount = calculateSubtotal();
          }
        }
        
        setCouponInfo({
          code: coupon.code,
          valid: true,
          discountAmount,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          message: response.data.message
        });
        
        setSuccess('Áp dụng mã giảm giá thành công!');
        setOpenSnackbar(true);
      }
    } catch (err: any) {
      setCouponInfo(null);
      setErrors(prev => ({ 
        ...prev, 
        couponCode: err.response?.data?.message || 'Mã giảm giá không hợp lệ'
      }));
      setError('Mã giảm giá không hợp lệ');
      setOpenSnackbar(true);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setSelectedCoupon('');
    setCouponInfo(null);
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
      
      const orderData = {
        shippingAddress: getFullShippingAddress(),
        paymentMethod,
        phoneNumber: deliveryInfo.phone,
        recipientName: deliveryInfo.fullName,
        items: items.map(item => ({
          productId: Number(item.id),
          quantity: item.quantity
        })),
        couponCode: couponInfo?.code,
        total: getFinalTotal()
      };
      
      if (paymentMethod === 'cod' || paymentMethod === 'account_balance') {
        const response = await OrderService.createOrder(orderData);
        console.log("refreshHeaderNotifications đang chạy...");
        try {
          refreshHeaderNotifications();
          await refreshNotifications();
          clearCart();
        } catch (err) {
          console.error('Lỗi khi refresh thông báo:', err);
        }
        navigate('/order-success', { state: { orderId: response.data.id } });
      } else if (paymentMethod === 'credit') {
        const paymentData = { ...orderData };
        localStorage.setItem('pendingOrder', JSON.stringify(paymentData));
        const respon = await OrderService.createPay(paymentData);
        const paymentUrl = respon.data;
        window.location.href = paymentUrl;
      }
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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };
  
  const getFinalTotal = () => {
    const subtotal = calculateSubtotal();
    if (couponInfo && couponInfo.valid) {
      return subtotal - couponInfo.discountAmount;
    }
    return subtotal;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
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
          <>
            <FormControl component="fieldset" error={!!errors.paymentMethod} sx={{ width: '100%', mb: 4 }}>
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
                
                <Paper sx={{ mb: 2, p: 2, border: paymentMethod === 'account_balance' ? `1px solid ${theme.palette.primary.main}` : 'none' }}>
                  <FormControlLabel 
                    value="account_balance" 
                    control={<Radio />} 
                    label={
                      <Box>
                        <Typography variant="subtitle1">Thanh toán bằng số dư tài khoản</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Sử dụng số dư hiện có trong tài khoản của bạn
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
                        <Typography variant="subtitle1">Thẻ điện tử</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Thanh toán an toàn với VNPAY
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
            
            <Typography variant="h6" gutterBottom>
              Mã giảm giá
            </Typography>
            <Paper sx={{ p: 2 }}>
              {userCoupons.length > 0 && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="coupon-select-label">Chọn mã giảm giá của bạn</InputLabel>
                  <Select
                    labelId="coupon-select-label"
                    id="coupon-select"
                    value={selectedCoupon}
                    label="Chọn mã giảm giá của bạn"
                    onChange={handleCouponSelection}
                    disabled={!!couponInfo || validatingCoupon}
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
              )}
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <TextField
                    fullWidth
                    label="Nhập mã giảm giá"
                    value={couponCode}
                    onChange={handleCouponChange}
                    error={!!errors.couponCode}
                    helperText={errors.couponCode}
                    disabled={!!couponInfo || validatingCoupon}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CouponIcon color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: couponInfo?.valid && (
                        <InputAdornment position="end">
                          <CheckIcon color="success" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item>
                  {couponInfo ? (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={handleRemoveCoupon}
                    >
                      Xóa
                    </Button>
                  ) : (
                    <Button 
                      variant="contained" 
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || (!couponCode.trim() && !selectedCoupon)}
                    >
                      {validatingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </Button>
                  )}
                </Grid>
              </Grid>
              
              {couponInfo && couponInfo.valid && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.contrastText">
                    {couponInfo.discountType === 'PERCENTAGE' 
                      ? `Giảm ${couponInfo.discountValue}% giá trị đơn hàng` 
                      : `Giảm ${formatCurrency(couponInfo.discountValue)} giá trị đơn hàng`}
                  </Typography>
                </Box>
              )}
            </Paper>
          </>
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
                  {paymentMethod === 'account_balance' && 'Thanh toán bằng số dư tài khoản'}
                  {paymentMethod === 'credit' && 'Thẻ tín dụng/Ghi nợ'}
                </Typography>
              </Paper>
              
              {couponInfo && couponInfo.valid && (
                <>
                  <Typography variant="subtitle1" gutterBottom>Mã giảm giá</Typography>
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1">
                        Mã: {couponInfo.code}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        {couponInfo.discountType === 'PERCENTAGE'
                          ? `Giảm ${couponInfo.discountValue}%`
                          : `Giảm ${formatCurrency(couponInfo.discountValue)}`}
                      </Typography>
                    </Box>
                  </Paper>
                </>
              )}
            </Grid>
          </Grid>
        );
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ width: '100%', my: 5 }}>
        <Typography variant="h4" gutterBottom>
          Thanh toán
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {orderError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {orderError}
          </Alert>
        )}
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: { xs: 3, md: 0 } }}>
              {getStepContent(activeStep)}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button 
                  startIcon={<ArrowBackIcon />} 
                  onClick={handleBack}
                >
                  {activeStep === 0 ? 'Quay lại giỏ hàng' : 'Quay lại'}
                </Button>
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    endIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    Tiếp tục
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tóm tắt đơn hàng
                </Typography>
                <List disablePadding>
                  {items.map(item => (
                    <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
                      <Grid container>
                        <Grid item xs={7}>
                          <Typography variant="body2">
                            {item.name} × {item.quantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={5} sx={{ textAlign: 'right' }}>
                          <Typography variant="body2">
                            {formatCurrency(item.price * item.quantity)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <Grid container>
                      <Grid item xs={7}>
                        <Typography variant="subtitle1">
                          Tạm tính
                        </Typography>
                      </Grid>
                      <Grid item xs={5} sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1">
                          {formatCurrency(calculateSubtotal())}
                        </Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                  
                  {couponInfo && couponInfo.valid && (
                    <ListItem sx={{ py: 1, px: 0 }}>
                      <Grid container>
                        <Grid item xs={7}>
                          <Typography variant="subtitle1" color="success.main">
                            Giảm giá
                          </Typography>
                        </Grid>
                        <Grid item xs={5} sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle1" color="success.main">
                            - {formatCurrency(couponInfo.discountAmount)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </ListItem>
                  )}
                  
                  <ListItem sx={{ py: 1, px: 0 }}>
                    <Grid container>
                      <Grid item xs={7}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Tổng cộng
                        </Typography>
                      </Grid>
                      <Grid item xs={5} sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {formatCurrency(getFinalTotal())}
                        </Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Checkout;