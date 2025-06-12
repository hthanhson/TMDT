import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  FormHelperText,
  InputAdornment,
  SelectChangeEvent
} from '@mui/material';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as CouponIcon,
  LocalOffer,
} from '@mui/icons-material';
import api from '../../services/api';
import { useSnackbar } from 'notistack';
import format from 'date-fns/format';

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit: number;
  usageCount: number;
  type: string;
  user?: User;
  description?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { enqueueSnackbar } = useSnackbar();
  
  // Form states for new/edit coupon
  const [formData, setFormData] = useState({
    id: null as string | null,
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isActive: true,
    usageLimit: 0,
    type: 'GENERAL',
    userId: '' as string,
    description: '',
  });
  
  // Form states for assign coupon
  const [assignFormData, setAssignFormData] = useState({
    userId: '' as string,
    discountAmount: 10,
    minOrderValue: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    type: 'ONE_TIME',
    description: 'Mã giảm giá cho khách hàng thân thiết',
  });

  useEffect(() => {
    fetchCoupons();
    fetchUsers();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get('/coupons');
      console.log('Fetched coupons:', response);
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      enqueueSnackbar('Không thể tải dữ liệu mã giảm giá', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = (coupon?: Coupon) => {
    if (coupon) {
      // Edit mode
      setEditingCoupon(coupon);
      setFormData({
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minPurchaseAmount: coupon.minPurchaseAmount,
        maxDiscountAmount: coupon.maxDiscountAmount || 0,
        startDate: new Date(coupon.startDate),
        endDate: new Date(coupon.endDate),
        isActive: coupon.isActive,
        usageLimit: coupon.usageLimit,
        type: coupon.type || 'GENERAL',
        userId: coupon.user?.id?.toString() || '',
        description: coupon.description || '',
      });
    } else {
      // Add mode
      setEditingCoupon(null);
      setFormData({
        id: null,
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minPurchaseAmount: 0,
        maxDiscountAmount: 0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        usageLimit: 0,
        type: 'GENERAL',
        userId: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };
  
  const handleOpenAssignDialog = () => {
    setOpenAssignDialog(true);
  };
  
  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.code) errors.code = 'Mã coupon không được để trống';
    if (formData.discountValue <= 0) errors.discountValue = 'Giá trị giảm giá phải lớn hơn 0';
    if (formData.discountType === 'PERCENTAGE' && formData.discountValue > 100) {
      errors.discountValue = 'Phần trăm giảm giá không thể vượt quá 100%';
    }
    if (formData.minPurchaseAmount < 0) errors.minPurchaseAmount = 'Giá trị đơn hàng tối thiểu không được âm';
    if (formData.startDate >= formData.endDate) errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateAssignForm = () => {
    const errors: Record<string, string> = {};
    
    if (!assignFormData.userId) errors.userId = 'Vui lòng chọn người dùng';
    if (assignFormData.discountAmount <= 0) errors.discountAmount = 'Giá trị giảm giá phải lớn hơn 0';
    if (assignFormData.minOrderValue < 0) errors.minOrderValue = 'Giá trị đơn hàng tối thiểu không được âm';
    if (!assignFormData.description) errors.description = 'Mô tả không được để trống';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData({ ...formData, [name]: value });
      // Clear error when field is changed
      if (formErrors[name]) {
        setFormErrors({ ...formErrors, [name]: '' });
      }
    }
  };
  
  const handleSelectChange = (e: SelectChangeEvent<string>, child: React.ReactNode) => {
    const name = e.target.name;
    const value = e.target.value;
    if (name) {
      setFormData({ ...formData, [name]: value || '' });
      // Clear error when field is changed
      if (formErrors[name]) {
        setFormErrors({ ...formErrors, [name]: '' });
      }
    }
  };

  const handleAssignInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setAssignFormData({ ...assignFormData, [name]: value });
      // Clear error when field is changed
      if (formErrors[name]) {
        setFormErrors({ ...formErrors, [name]: '' });
      }
    }
  };
  
  const handleAssignSelectChange = (e: SelectChangeEvent<string>, child: React.ReactNode) => {
    const name = e.target.name;
    const value = e.target.value;
    if (name) {
      setAssignFormData({ ...assignFormData, [name]: value || '' });
      // Clear error when field is changed
      if (formErrors[name]) {
        setFormErrors({ ...formErrors, [name]: '' });
      }
    }
  };

  const handleDateChange = (date: Date | null, field: 'startDate' | 'endDate') => {
    if (date) {
      setFormData({ ...formData, [field]: date });
      if (formErrors[field]) {
        setFormErrors({ ...formErrors, [field]: '' });
      }
    }
  };
  
  const handleAssignDateChange = (date: Date | null) => {
    if (date) {
      setAssignFormData({ ...assignFormData, expiryDate: date });
      if (formErrors.expiryDate) {
        setFormErrors({ ...formErrors, expiryDate: '' });
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      let response;
      if (editingCoupon) {
        // Update existing coupon
        response = await api.put(`/coupons/${editingCoupon.id}`, formData);
        enqueueSnackbar('Cập nhật mã giảm giá thành công', { variant: 'success' });
      } else {
        // Create new coupon
        response = await api.post('/coupons', formData);
        enqueueSnackbar('Tạo mã giảm giá mới thành công', { variant: 'success' });
      }
      
      handleCloseDialog();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
      enqueueSnackbar('Lỗi khi lưu mã giảm giá', { variant: 'error' });
    }
  };
  
  const handleAssignSubmit = async () => {
    if (!validateAssignForm()) return;
    
    try {
      const response = await api.post('/coupons/assign', null, {
        params: {
          userId: assignFormData.userId,
          discountAmount: assignFormData.discountAmount,
          minOrderValue: assignFormData.minOrderValue,
          expiryDate: assignFormData.expiryDate.toISOString(),
          type: assignFormData.type,
          description: assignFormData.description
        }
      });
      
      enqueueSnackbar('Gán mã giảm giá cho người dùng thành công', { variant: 'success' });
      handleCloseAssignDialog();
      fetchCoupons();
    } catch (error) {
      console.error('Error assigning coupon:', error);
      enqueueSnackbar('Lỗi khi gán mã giảm giá', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn vô hiệu hóa mã giảm giá này?')) {
      try {
        await api.delete(`/coupons/${id}`);
        enqueueSnackbar('Vô hiệu hóa mã giảm giá thành công', { variant: 'success' });
        fetchCoupons();
      } catch (error) {
        console.error('Error deleting coupon:', error);
        enqueueSnackbar('Lỗi khi vô hiệu hóa mã giảm giá', { variant: 'error' });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <CouponIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Quản lý mã giảm giá
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ mr: 1 }}
          >
            Tạo mã giảm giá
          </Button>
          {/* <Button
            variant="outlined"
            startIcon={<LocalOffer />}
            onClick={handleOpenAssignDialog}
          >
            Tặng mã giảm giá
          </Button> */}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Giảm giá</TableCell>
              <TableCell>Đơn hàng tối thiểu</TableCell>
              <TableCell>Thời hạn</TableCell>
              <TableCell>Sử dụng</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Người dùng</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!Array.isArray(coupons) || coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  Không có mã giảm giá nào
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>{coupon.code}</TableCell>
                  <TableCell>{coupon.description || coupon.code}</TableCell>
                  <TableCell>
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}%`
                      : `${coupon.discountValue.toFixed(2)} VND`}
                  </TableCell>
                  <TableCell>{coupon.minPurchaseAmount.toFixed(2)} VND</TableCell>
                  <TableCell>
                    {coupon.startDate && formatDate(coupon.startDate)} - {coupon.endDate && formatDate(coupon.endDate)}
                  </TableCell>
                  <TableCell>
                    {coupon.usageCount || 0}/{coupon.usageLimit === 0 ? '∞' : coupon.usageLimit}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={coupon.type === 'ONE_TIME' ? 'Một lần' : 'Nhiều lần'}
                      color={coupon.type === 'ONE_TIME' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {coupon.user ? coupon.user.username : 'Tất cả'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={coupon.isActive ? 'Đang hoạt động' : 'Đã vô hiệu'}
                      color={coupon.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(coupon)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(coupon.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Add/Edit Coupon */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="code"
                  label="Mã giảm giá"
                  value={formData.code}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!formErrors.code}
                  helperText={formErrors.code}
                  disabled={editingCoupon !== null}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại giảm giá</InputLabel>
                  <Select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleSelectChange}
                    label="Loại giảm giá"
                  >
                    <MenuItem value="PERCENTAGE">Phần trăm (%)</MenuItem>
                    <MenuItem value="FIXED_AMOUNT">Số tiền cố định ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="discountValue"
                  label={formData.discountType === 'PERCENTAGE' ? 'Phần trăm giảm giá' : 'Số tiền giảm giá'}
                  type="number"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!formErrors.discountValue}
                  helperText={formErrors.discountValue}
                  InputProps={{
                    endAdornment: formData.discountType === 'PERCENTAGE' ? '%' : '$',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="minPurchaseAmount"
                  label="Giá trị đơn hàng tối thiểu"
                  type="number"
                  value={formData.minPurchaseAmount}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!formErrors.minPurchaseAmount}
                  helperText={formErrors.minPurchaseAmount}
                  InputProps={{ startAdornment: 'VND' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="maxDiscountAmount"
                  label="Giảm tối đa"
                  type="number"
                  value={formData.maxDiscountAmount}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!formErrors.maxDiscountAmount}
                  helperText={formErrors.maxDiscountAmount}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại sử dụng</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleSelectChange}
                    label="Loại sử dụng"
                  >
                    <MenuItem value="GENERAL">Nhiều lần</MenuItem>
                    <MenuItem value="ONE_TIME">Một lần duy nhất</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Mô tả"
                  value={formData.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Ngày bắt đầu"
                    value={formData.startDate}
                    onChange={(date) => handleDateChange(date, 'startDate')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formErrors.startDate,
                        helperText: formErrors.startDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Ngày kết thúc"
                    value={formData.endDate}
                    onChange={(date) => handleDateChange(date, 'endDate')}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formErrors.endDate,
                        helperText: formErrors.endDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              {/* <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Người dùng cụ thể (để trống = áp dụng cho tất cả)</InputLabel>
                  <Select
                    name="userId"
                    value={formData.userId || ''}
                    onChange={handleSelectChange}
                    label="Người dùng cụ thể (để trống = áp dụng cho tất cả)"
                  >
                    {Array.isArray(users) && users.map((user) => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid> */}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCoupon ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog for Assign Coupon to User */}
      <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Tặng mã giảm giá cho người dùng</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.userId}>
                  <InputLabel>Chọn người dùng</InputLabel>
                  <Select
                    name="userId"
                    value={assignFormData.userId}
                    onChange={handleAssignSelectChange}
                    label="Chọn người dùng"
                    required
                  >
                    {Array.isArray(users) && users.map((user) => (
                      <MenuItem key={user.id} value={user.id.toString()}>
                        {user.username}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.userId && <FormHelperText>{formErrors.userId}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="discountAmount"
                  label="Giá trị giảm giá ($)"
                  type="number"
                  value={assignFormData.discountAmount}
                  onChange={handleAssignInputChange}
                  fullWidth
                  required
                  error={!!formErrors.discountAmount}
                  helperText={formErrors.discountAmount}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="minOrderValue"
                  label="Giá trị đơn hàng tối thiểu"
                  type="number"
                  value={assignFormData.minOrderValue}
                  onChange={handleAssignInputChange}
                  fullWidth
                  error={!!formErrors.minOrderValue}
                  helperText={formErrors.minOrderValue}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Loại sử dụng</InputLabel>
                  <Select
                    name="type"
                    value={assignFormData.type}
                    onChange={handleAssignSelectChange}
                    label="Loại sử dụng"
                  >
                    <MenuItem value="ONE_TIME">Một lần duy nhất</MenuItem>
                    <MenuItem value="MULTI_USE">Nhiều lần</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Ngày hết hạn"
                    value={assignFormData.expiryDate}
                    onChange={handleAssignDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!formErrors.expiryDate,
                        helperText: formErrors.expiryDate,
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Mô tả"
                  value={assignFormData.description}
                  onChange={handleAssignInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Hủy</Button>
          <Button onClick={handleAssignSubmit} variant="contained">
            Tặng mã giảm giá
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminCoupons;