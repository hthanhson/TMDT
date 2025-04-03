import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import NotificationService from '../../services/NotificationService';
import { toast } from 'react-toastify';
import { Notification } from '../../types/notification';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filter state
  const [filter, setFilter] = useState({
    type: '',
    message: ''
  });
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    message: '',
    type: 'SYSTEM',
    targetUserType: 'ALL'
  });
  
  useEffect(() => {
    fetchNotifications();
  }, [page, rowsPerPage, filter]);
  
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Sử dụng mock service
      const response = await NotificationService.getNotifications();
      const filteredNotifications = response.data.filter((notification: Notification) => {
        // Lọc theo điều kiện
        if (filter.type && notification.type !== filter.type) return false;
        if (filter.message && !notification.message.toLowerCase().includes(filter.message.toLowerCase())) return false;
        return true;
      });
      
      // Phân trang manual
      const startIndex = page * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      const paginatedData = filteredNotifications.slice(startIndex, endIndex);
      
      setNotifications(paginatedData);
      setTotalElements(filteredNotifications.length);
      setError(null);
    } catch (err: any) {
      console.error('Lỗi khi tải thông báo:', err);
      setError('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };
  
  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
  };
  
  const handleFormTextFieldChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFormSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreateClick = () => {
    setFormData({
      message: '',
      type: 'SYSTEM',
      targetUserType: 'ALL'
    });
    setCreateDialogOpen(true);
  };
  
  const handleDeleteClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setDeleteDialogOpen(true);
  };
  
  const handleViewClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setViewDialogOpen(true);
  };
  
  const handleCreateSubmit = async () => {
    try {
      // Mock tạo thông báo mới
      toast.success('Tạo thông báo thành công');
      setCreateDialogOpen(false);
      fetchNotifications();
    } catch (err: any) {
      console.error('Lỗi khi tạo thông báo:', err);
      toast.error('Không thể tạo thông báo');
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!selectedNotification) return;
    
    try {
      // Mock xóa thông báo
      toast.success('Đã xóa thông báo');
      setDeleteDialogOpen(false);
      fetchNotifications();
    } catch (err: any) {
      console.error('Lỗi khi xóa thông báo:', err);
      toast.error('Không thể xóa thông báo');
    }
  };
  
  // Format thời gian
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý thông báo
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
        >
          Tạo thông báo mới
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nội dung"
              name="message"
              value={filter.message}
              onChange={handleTextFieldChange}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Loại thông báo</InputLabel>
              <Select
                name="type"
                value={filter.type}
                label="Loại thông báo"
                onChange={handleSelectChange}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="SYSTEM">Hệ thống</MenuItem>
                <MenuItem value="PROMOTION">Khuyến mãi</MenuItem>
                <MenuItem value="ORDER">Đơn hàng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nội dung</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={30} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không tìm thấy thông báo nào
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>{notification.id}</TableCell>
                  <TableCell>{notification.message}</TableCell>
                  <TableCell>
                    <Chip 
                      label={
                        notification.type === 'SYSTEM' ? 'Hệ thống' :
                        notification.type === 'PROMOTION' ? 'Khuyến mãi' :
                        notification.type === 'ORDER' ? 'Đơn hàng' : 'Khác'
                      }
                      color={
                        notification.type === 'SYSTEM' ? 'info' :
                        notification.type === 'PROMOTION' ? 'secondary' :
                        notification.type === 'ORDER' ? 'primary' : 'default'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(notification.createdAt)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={notification.isRead ? 'Đã đọc' : 'Chưa đọc'} 
                      color={notification.isRead ? 'default' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewClick(notification)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteClick(notification)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Hiển thị:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} trên ${count}`}
        />
      </TableContainer>
      
      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo thông báo mới</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nội dung thông báo"
                name="message"
                value={formData.message}
                onChange={handleFormTextFieldChange}
                required
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Loại thông báo</InputLabel>
                <Select
                  name="type"
                  value={formData.type}
                  label="Loại thông báo"
                  onChange={handleFormSelectChange}
                >
                  <MenuItem value="SYSTEM">Hệ thống</MenuItem>
                  <MenuItem value="PROMOTION">Khuyến mãi</MenuItem>
                  <MenuItem value="ORDER">Đơn hàng</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Gửi đến</InputLabel>
                <Select
                  name="targetUserType"
                  value={formData.targetUserType}
                  label="Gửi đến"
                  onChange={handleFormSelectChange}
                >
                  <MenuItem value="ALL">Tất cả người dùng</MenuItem>
                  <MenuItem value="CUSTOMER">Khách hàng</MenuItem>
                  <MenuItem value="ADMIN">Quản trị viên</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleCreateSubmit} 
            variant="contained" 
            disabled={!formData.message.trim() || !formData.type}
          >
            Tạo
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết thông báo</DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedNotification.message}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">ID:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{selectedNotification.id}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Loại thông báo:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Chip 
                    label={
                      selectedNotification.type === 'SYSTEM' ? 'Hệ thống' :
                      selectedNotification.type === 'PROMOTION' ? 'Khuyến mãi' :
                      selectedNotification.type === 'ORDER' ? 'Đơn hàng' : 'Khác'
                    }
                    color={
                      selectedNotification.type === 'SYSTEM' ? 'info' :
                      selectedNotification.type === 'PROMOTION' ? 'secondary' :
                      selectedNotification.type === 'ORDER' ? 'primary' : 'default'
                    }
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Trạng thái:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Chip 
                    label={selectedNotification.isRead ? 'Đã đọc' : 'Chưa đọc'} 
                    color={selectedNotification.isRead ? 'default' : 'warning'}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="textSecondary">Ngày tạo:</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body2">{formatDate(selectedNotification.createdAt)}</Typography>
                </Grid>
                
                {selectedNotification.additionalData && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Dữ liệu bổ sung:</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2">
                        {JSON.stringify(selectedNotification.additionalData, null, 2)}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa thông báo này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error">Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminNotifications; 