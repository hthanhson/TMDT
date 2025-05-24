import React, { useState, useEffect } from 'react';
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
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import AdminService from '../../services/AdminService';
import { formatCurrency } from '../../utils/formatters';

interface Order {
  id: string;
  userId: string;
  username: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: any[];
  user: any;
  totalAmount: number;
  refundStatus?: string;
  refundRequest?: any;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [refundProcessing, setRefundProcessing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAllOrders();
      
      console.log('Raw response from AdminService:', response);
      
      // Process any response format
      let processedOrders: any[] = [];
      
      if (response && response.data) {
        // Case 1: Array of orders
        if (Array.isArray(response.data)) {
          processedOrders = response.data;
        } 
        // Case 2: Paginated response
        else if (response.data.content && Array.isArray(response.data.content)) {
          processedOrders = response.data.content;
        }
        // Case 3: Single object response (could be the last item in array)
        else if (response.data.id) {
          processedOrders = [response.data];
        }
        
        console.log('Processed orders before normalization:', processedOrders);
        
        // Normalize each order object to have consistent properties
        const normalizedOrders = await Promise.all(processedOrders.map(async (order: any) => {
          // Make a copy to avoid modifying the original
          const normalizedOrder = { ...order };
          
          // Chi tiết debug để xem cấu trúc dữ liệu
          console.log(`Đơn hàng #${order.id} - Dữ liệu gốc:`, {
            user: order.user,
            userId: order.userId,
            username: order.username,
            recipientName: order.recipientName,
            order_username: order.order_username,
            customer: order.customer
          });
          
          // Đảm bảo user object được xử lý đúng cách
          if (typeof normalizedOrder.user === 'number' || typeof normalizedOrder.user === 'string') {
            normalizedOrder.userId = normalizedOrder.user;
            normalizedOrder.user = { id: normalizedOrder.user };
          }
          
          // Đảm bảo user là một object
          if (!normalizedOrder.user || typeof normalizedOrder.user !== 'object') {
            normalizedOrder.user = {};
          }
          
          // Lưu trữ userId nếu chưa có
          if (!normalizedOrder.userId && normalizedOrder.user && normalizedOrder.user.id) {
            normalizedOrder.userId = normalizedOrder.user.id;
          }
          
          // ƯU TIÊN SỬ DỤNG RECIPIENT NAME NẾU CÓ
          if (normalizedOrder.recipientName && typeof normalizedOrder.recipientName === 'string' && normalizedOrder.recipientName.trim() !== '') {
            normalizedOrder.user.displayName = normalizedOrder.recipientName;
          } else {
            // Xử lý các trường hợp có thể có tên người dùng
            const possibleUsernameFields = [
              normalizedOrder.user?.username,
              normalizedOrder.user?.fullName,
              normalizedOrder.username,
              normalizedOrder.user?.name,
              normalizedOrder.order_username,
              normalizedOrder.customer?.name,
              normalizedOrder.customer?.username
            ];
            
            let bestUsername = null;
            for (const field of possibleUsernameFields) {
              if (field && typeof field === 'string' && field.trim() !== '') {
                bestUsername = field;
                break;
              }
            }
            
            // Nếu không tìm thấy tên người dùng hợp lệ, tạo tên mặc định
            if (!bestUsername) {
              bestUsername = `Khách hàng #${normalizedOrder.userId || normalizedOrder.user.id || 'Unknown'}`;
            }
            
            // Đảm bảo user object có username
            normalizedOrder.user.displayName = bestUsername;
          }
          
          // Ensure required fields have values
          if (!normalizedOrder.id) normalizedOrder.id = '';
          if (!normalizedOrder.status) normalizedOrder.status = 'UNKNOWN';
          if (!normalizedOrder.totalAmount) normalizedOrder.totalAmount = 0;
          if (!normalizedOrder.createdAt) normalizedOrder.createdAt = '';
          if (!normalizedOrder.updatedAt) normalizedOrder.updatedAt = '';
          
          // Debug cuối cùng để xem đối tượng đã được xử lý
          console.log(`Đơn hàng #${normalizedOrder.id} - Sau khi xử lý:`, {
            user: normalizedOrder.user,
            userId: normalizedOrder.userId,
            displayName: normalizedOrder.user.displayName
          });
          
          return normalizedOrder;
        }));
        
        console.log('Normalized orders:', normalizedOrders);
        
        // Cho mỗi đơn hàng, kiểm tra trạng thái hoàn tiền
        const ordersWithRefundStatus = await Promise.all(
          normalizedOrders.map(async (order) => {
            try {
              const refundResponse = await AdminService.getRefundStatus(order.id);
              if (refundResponse && refundResponse.data) {
                order.refundStatus = refundResponse.data.status;
                order.refundRequest = refundResponse.data;
              } else {
                order.refundStatus = 'NONE';
              }
            } catch (error) {
              console.error(`Error fetching refund status for order ${order.id}:`, error);
              order.refundStatus = 'NONE';
            }
            return order;
          })
        );
        
        setOrders(ordersWithRefundStatus);
      } else {
        console.warn('No data in response:', response);
        setOrders([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết refund request cho một đơn hàng
  const fetchRefundStatus = async (orderId: string) => {
    try {
      const response = await AdminService.getRefundStatus(orderId);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching refund status:', err);
      return null;
    }
  };

  // Helper function để xác thực và chuẩn bị URL hình ảnh
  const prepareImageUrl = (url: string): string[] => {
    if (!url) return [];
    
    // Debugging - log full URL info
    console.log("Original URL:", url);
    
    // Backend server URL (port 8080)
    const backendUrl = 'http://localhost:8080';
    
    // Comprehensive URL generation attempts
    const urlAttempts: string[] = [
      // Direct file download endpoint
      `${backendUrl}/api/files/download/${url.split('/').pop() || url}`,
      
      // Various potential upload paths
      `${backendUrl}/uploads/refunds/${url.split('/').pop() || url}`,
      `${backendUrl}/refunds/${url.split('/').pop() || url}`,
      `${backendUrl}/upload/refunds/${url.split('/').pop() || url}`,
      
      // If it's a relative path
      url.startsWith('/') ? `${backendUrl}${url}` : `${backendUrl}/${url}`,
      
      // If it's a full URL already
      url.startsWith('http') ? url : `${backendUrl}/${url}`
    ].filter(Boolean); // Remove any empty strings
    
    // Log all potential URLs for debugging
    console.log("URL Attempts:", urlAttempts);
    
    return urlAttempts;
  };

  // In the image rendering sections, update the error handling
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>, 
    urlAttempts: string[]
  ) => {
    console.error(`Failed to load image URL: ${e.currentTarget.src}`);
    
    // Create a copy of URL attempts to avoid mutating the original
    const currentUrlAttempts = [...urlAttempts];
    
    // Remove the failed URL from attempts
    currentUrlAttempts.shift();
    
    // Try next URL if available
    if (currentUrlAttempts.length > 0) {
      e.currentTarget.src = currentUrlAttempts[0];
    } else {
      // Fallback to SVG placeholder
      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3EImage Error%3C/text%3E%3C/svg%3E";
    }
  };

  // Mở hình ảnh trong chế độ preview
  const openImagePreview = (url: string) => {
    // Ngăn các lỗi URL có thể làm reload trang
    try {
      console.log("Opening image preview:", url);
      // Thử mở trong tab mới, nhưng không reload trang hiện tại nếu có lỗi
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.focus();
      } else {
        console.warn("Trình duyệt đã chặn popup, hiển thị hình ảnh trong modal");
        // TODO: Có thể thêm modal preview ở đây
      }
    } catch (err) {
      console.error("Lỗi khi mở hình ảnh:", err);
    }
  };

  const isValidStatusTransition = (currentStatus: string, newStatus: string): boolean => {
    const validTransitions: { [key: string]: string[] } = {
      'PENDING': ['PROCESSING', 'CANCELLED', 'CONFIRMED'],
      'CONFIRMED': ['PROCESSING', 'READY_TO_SHIP', 'CANCELLED'],
      'PROCESSING': ['READY_TO_SHIP', 'PICKED_UP', 'CANCELLED'],
      'READY_TO_SHIP': ['PICKED_UP', 'CANCELLED'],
      'PICKED_UP': ['IN_TRANSIT', 'CANCELLED'],
      'IN_TRANSIT': ['ARRIVED_AT_STATION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      'ARRIVED_AT_STATION': ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'RETURNED', 'CANCELLED'],
      'DELIVERED': ['COMPLETED', 'RETURNED'],
      'COMPLETED': ['RETURNED'],
      'CANCELLED': [],
      'RETURNED': []
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  const handleStatusChange = async (orderId: string, newStatus: string, currentStatus: string) => {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      setError(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      return;
    }

    try {
      await AdminService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh the orders list
      setError(null);
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleOpenDialog = async (order: any) => {
    // Nếu đơn hàng có refund request, lấy thêm thông tin chi tiết
    if (order.refundStatus && order.refundStatus !== 'NONE') {
      try {
        const refundData = await fetchRefundStatus(order.id);
        if (refundData) {
          order.refundRequest = refundData;
          // Add detailed logging of the refund request structure
          console.log('REFUND REQUEST FULL DATA:', JSON.stringify(refundData, null, 2));
          console.log('Image URLs if any:', refundData.imageUrls);
        }
      } catch (err) {
        console.error('Error fetching refund details:', err);
      }
    }
    
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenRefundDialog = (order: any) => {
    setSelectedOrder(order);
    setAdminNotes('');
    setRefundDialogOpen(true);
  };

  const handleCloseRefundDialog = () => {
    setRefundDialogOpen(false);
  };

  // Xử lý yêu cầu hoàn tiền
  const handleRefundRequest = async (orderId: string, status: string) => {
    try {
      setRefundProcessing(true);
      await AdminService.updateRefundStatus(orderId, status, adminNotes);
      setRefundDialogOpen(false);
      fetchOrders(); // Refresh data
      setError(null);
    } catch (err: any) {
      console.error('Error processing refund:', err);
      setError(err.response?.data?.message || 'Failed to process refund request');
    } finally {
      setRefundProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
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
      case 'REFUNDED':
        return 'secondary';
      case 'ON_HOLD':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'COMPLETED':
        return 'info';
      case 'REVIEWING':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý đơn hàng
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn hàng</TableCell>
              <TableCell>Ngày</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Tổng tiền</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Trạng thái hoàn tiền</TableCell>
              <TableCell>Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(orders) && orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>
                    {order.createdAt && format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {order.user && order.user.displayName ? order.user.displayName : 
                     (order.user && typeof order.user === 'object' ? 
                       (order.user.fullName || order.user.username || order.username || `Khách hàng #${order.userId || order.user.id || 'Unknown'}`) : 
                       `Khách hàng #${order.userId || 'Unknown'}`)}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(order.totalAmount) || 0)}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {order.refundStatus && order.refundStatus !== 'NONE' ? (
                      <Chip
                        label={
                          order.refundStatus === 'REQUESTED' ? 'Process Refund' :
                          order.refundStatus === 'APPROVED' ? 'Refund Complete' :
                          order.refundStatus === 'REJECTED' ? 'Refund Failed' :
                          order.refundStatus
                        }
                        color={getRefundStatusColor(order.refundStatus)}
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">Không có hoàn tiền</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                        <InputLabel id={`status-label-${order.id}`}>Trạng thái</InputLabel>
                        <Select
                          labelId={`status-label-${order.id}`}
                          value={order.status || ''}
                          label="Trạng thái"
                          onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                          disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'RETURNED'}
                        >
                          <MenuItem value="PENDING" disabled={!isValidStatusTransition(order.status, 'PENDING')}>Chờ xác nhận</MenuItem>
                          <MenuItem value="CONFIRMED" disabled={!isValidStatusTransition(order.status, 'CONFIRMED')}>Đã xác nhận</MenuItem>
                          <MenuItem value="PROCESSING" disabled={!isValidStatusTransition(order.status, 'PROCESSING')}>Đang xử lý</MenuItem>
                          <MenuItem value="READY_TO_SHIP" disabled={!isValidStatusTransition(order.status, 'READY_TO_SHIP')}>Sẵn sàng giao hàng</MenuItem>
                          <MenuItem value="PICKED_UP" disabled={!isValidStatusTransition(order.status, 'PICKED_UP')}>Đã lấy hàng</MenuItem>
                          <MenuItem value="IN_TRANSIT" disabled={!isValidStatusTransition(order.status, 'IN_TRANSIT')}>Đang vận chuyển</MenuItem>
                          <MenuItem value="ARRIVED_AT_STATION" disabled={!isValidStatusTransition(order.status, 'ARRIVED_AT_STATION')}>Đến trạm trung chuyển</MenuItem>
                          <MenuItem value="OUT_FOR_DELIVERY" disabled={!isValidStatusTransition(order.status, 'OUT_FOR_DELIVERY')}>Đang giao hàng</MenuItem>
                          <MenuItem value="DELIVERED" disabled={!isValidStatusTransition(order.status, 'DELIVERED')}>Đã giao hàng</MenuItem>
                          <MenuItem value="COMPLETED" disabled={!isValidStatusTransition(order.status, 'COMPLETED')}>Hoàn tất</MenuItem>
                          <MenuItem value="CANCELLED" disabled={!isValidStatusTransition(order.status, 'CANCELLED')}>Đã hủy</MenuItem>
                          <MenuItem value="RETURNED" disabled={!isValidStatusTransition(order.status, 'RETURNED')}>Hoàn trả</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenDialog(order)}
                      >
                        Chi tiết
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>
              Chi tiết đơn hàng #{selectedOrder.id}
              <Chip
                label={selectedOrder.status}
                color={getStatusColor(selectedOrder.status)}
                size="small"
                sx={{ ml: 2 }}
              />
              {selectedOrder.refundStatus && selectedOrder.refundStatus !== 'NONE' && (
                <Chip
                  label={
                    selectedOrder.refundStatus === 'REQUESTED' ? 'Process Refund' :
                    selectedOrder.refundStatus === 'APPROVED' ? 'Refund Complete' :
                    selectedOrder.refundStatus === 'REJECTED' ? 'Refund Failed' :
                    `Hoàn tiền: ${selectedOrder.refundStatus}`
                  }
                  color={getRefundStatusColor(selectedOrder.refundStatus)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              )}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Thông tin đơn hàng
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ngày đặt:</strong> {selectedOrder.createdAt && format(new Date(selectedOrder.createdAt), 'PPP')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Khách hàng:</strong> {
                      selectedOrder.user && selectedOrder.user.displayName ? selectedOrder.user.displayName :
                      (selectedOrder.user && typeof selectedOrder.user === 'object' ?
                        (selectedOrder.user.fullName || selectedOrder.user.username || selectedOrder.username || `Khách hàng #${selectedOrder.userId || selectedOrder.user.id || 'Unknown'}`) :
                        `Khách hàng #${selectedOrder.userId || 'Unknown'}`)
                    }
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {
                      selectedOrder.user && typeof selectedOrder.user === 'object'
                        ? selectedOrder.user?.email || 'N/A'
                        : 'N/A'
                    }
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phương thức thanh toán:</strong> {selectedOrder.paymentMethod}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Trạng thái thanh toán:</strong> {selectedOrder.paymentStatus}
                  </Typography>
                  
                  <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                    Địa chỉ giao hàng
                  </Typography>
                  <Typography variant="body2">
                    {selectedOrder.shippingAddress}
                  </Typography>
                  
                  {/* Hiển thị thông tin refund nếu có */}
                  {selectedOrder.refundRequest && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        Yêu cầu hoàn tiền
                      </Typography>
                      <Typography variant="body2">
                        <strong>Trạng thái:</strong> {
                          selectedOrder.refundRequest.status === 'REQUESTED' ? 'Chờ xử lý' :
                          selectedOrder.refundRequest.status === 'APPROVED' ? 'Đã chấp nhận' :
                          selectedOrder.refundRequest.status === 'REJECTED' ? 'Đã từ chối' :
                          selectedOrder.refundRequest.status
                        }
                        {selectedOrder.refundRequest.status === 'APPROVED' && (
                          <Chip 
                            label="Refund Complete" 
                            color="success" 
                            size="small" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                        {selectedOrder.refundRequest.status === 'REJECTED' && (
                          <Chip 
                            label="Refund Failed" 
                            color="error" 
                            size="small" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Lý do:</strong> {selectedOrder.refundRequest.reason}
                      </Typography>
                      {selectedOrder.refundRequest.additionalInfo && (
                        <Typography variant="body2">
                          <strong>Thông tin thêm:</strong> {selectedOrder.refundRequest.additionalInfo}
                        </Typography>
                      )}
                      {selectedOrder.refundRequest.adminNotes && (
                        <Typography variant="body2">
                          <strong>Admin Notes:</strong> {selectedOrder.refundRequest.adminNotes}
                        </Typography>
                      )}
                      
                      {/* Hiển thị hình ảnh mà người dùng đã upload nếu có */}
                      {selectedOrder.refundRequest && selectedOrder.refundRequest.imageUrls && 
                       Array.isArray(selectedOrder.refundRequest.imageUrls) && 
                       selectedOrder.refundRequest.imageUrls.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Hình ảnh đã tải lên:</strong>
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {selectedOrder.refundRequest.imageUrls.map((url: string, index: number) => {
                              // Generate multiple URL attempts
                              const urlAttempts = prepareImageUrl(url);
                              
                              return (
                                <Box 
                                  key={index}
                                  sx={{ 
                                    width: 100, 
                                    height: 100, 
                                    position: 'relative',
                                    border: '1px solid #ddd',
                                    borderRadius: 1,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                    backgroundColor: '#f5f5f5'
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    // Open the first valid URL
                                    openImagePreview(urlAttempts[0]);
                                  }}
                                >
                                  <img
                                    src={urlAttempts[0]}
                                    alt={`Refund evidence ${index + 1}`}
                                    style={{ 
                                      maxWidth: '100%', 
                                      maxHeight: '100%', 
                                      objectFit: 'cover'
                                    }}
                                    onError={(e) => handleImageError(e, urlAttempts)}
                                  />
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      )}
                      
                      {/* Nếu yêu cầu hoàn tiền đang chờ xử lý, hiển thị nút xử lý */}
                      {selectedOrder.refundStatus === 'REQUESTED' && (
                        <Box sx={{ mt: 2 }}>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={() => handleOpenRefundDialog(selectedOrder)}
                            size="small"
                          >
                            Xử lý hoàn tiền
                          </Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Sản phẩm đã đặt
                  </Typography>
                  <List>
                    {Array.isArray(selectedOrder.orderItems) && selectedOrder.orderItems.map((item: any) => (
                      <React.Fragment key={item.id}>
                        <ListItem>
                          <ListItemText
                            primary={item.productName}
                            secondary={`Quantity: ${item.quantity}`}
                          />
                          <Typography>
                            {formatCurrency(parseFloat(item.price) * item.quantity)}
                          </Typography>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Tổng cộng:</Typography>
                      <Typography variant="h6">
                        {formatCurrency(Number(selectedOrder.totalAmount) || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Đóng</Button>
              {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'RETURNED' && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="status-update-label">Cập nhật trạng thái</InputLabel>
                  <Select
                    labelId="status-update-label"
                    value={selectedOrder.status}
                    label="Cập nhật trạng thái"
                    onChange={(e) => {
                      handleStatusChange(selectedOrder.id, e.target.value, selectedOrder.status);
                      handleCloseDialog();
                    }}
                  >
                    <MenuItem value="PENDING" disabled={!isValidStatusTransition(selectedOrder.status, 'PENDING')}>Chờ xác nhận</MenuItem>
                    <MenuItem value="CONFIRMED" disabled={!isValidStatusTransition(selectedOrder.status, 'CONFIRMED')}>Đã xác nhận</MenuItem>
                    <MenuItem value="PROCESSING" disabled={!isValidStatusTransition(selectedOrder.status, 'PROCESSING')}>Đang xử lý</MenuItem>
                    <MenuItem value="READY_TO_SHIP" disabled={!isValidStatusTransition(selectedOrder.status, 'READY_TO_SHIP')}>Sẵn sàng giao hàng</MenuItem>
                    <MenuItem value="PICKED_UP" disabled={!isValidStatusTransition(selectedOrder.status, 'PICKED_UP')}>Đã lấy hàng</MenuItem>
                    <MenuItem value="IN_TRANSIT" disabled={!isValidStatusTransition(selectedOrder.status, 'IN_TRANSIT')}>Đang vận chuyển</MenuItem>
                    <MenuItem value="ARRIVED_AT_STATION" disabled={!isValidStatusTransition(selectedOrder.status, 'ARRIVED_AT_STATION')}>Đến trạm trung chuyển</MenuItem>
                    <MenuItem value="OUT_FOR_DELIVERY" disabled={!isValidStatusTransition(selectedOrder.status, 'OUT_FOR_DELIVERY')}>Đang giao hàng</MenuItem>
                    <MenuItem value="DELIVERED" disabled={!isValidStatusTransition(selectedOrder.status, 'DELIVERED')}>Đã giao hàng</MenuItem>
                    <MenuItem value="COMPLETED" disabled={!isValidStatusTransition(selectedOrder.status, 'COMPLETED')}>Hoàn tất</MenuItem>
                    <MenuItem value="CANCELLED" disabled={!isValidStatusTransition(selectedOrder.status, 'CANCELLED')}>Đã hủy</MenuItem>
                    <MenuItem value="RETURNED" disabled={!isValidStatusTransition(selectedOrder.status, 'RETURNED')}>Hoàn trả</MenuItem>
                  </Select>
                </FormControl>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Refund Processing Dialog */}
      <Dialog open={refundDialogOpen} onClose={handleCloseRefundDialog} maxWidth="sm" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>Xử lý yêu cầu hoàn tiền</DialogTitle>
            <DialogContent>
              <Typography variant="body1" gutterBottom>
                Đơn hàng #{selectedOrder.id} có yêu cầu hoàn tiền. Vui lòng xem xét thông tin dưới đây:
              </Typography>
              
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="body2">
                  <strong>Khách hàng:</strong> {
                    selectedOrder.user && selectedOrder.user.displayName ? selectedOrder.user.displayName :
                    (selectedOrder.user && typeof selectedOrder.user === 'object' ?
                      (selectedOrder.user.fullName || selectedOrder.user.username || selectedOrder.username || `Khách hàng #${selectedOrder.userId || selectedOrder.user.id || 'Unknown'}`) :
                      `Khách hàng #${selectedOrder.userId || 'Unknown'}`)
                  }
                </Typography>
                <Typography variant="body2">
                  <strong>Số tiền:</strong> {formatCurrency(Number(selectedOrder.totalAmount) || 0)}
                </Typography>
                {selectedOrder.refundRequest && (
                  <>
                    <Typography variant="body2">
                      <strong>Lý do:</strong> {selectedOrder.refundRequest.reason}
                    </Typography>
                    {selectedOrder.refundRequest.additionalInfo && (
                      <Typography variant="body2">
                        <strong>Thông tin thêm:</strong> {selectedOrder.refundRequest.additionalInfo}
                      </Typography>
                    )}
                    
                    {/* Hiển thị hình ảnh trong dialog xử lý hoàn tiền */}
                    {selectedOrder.refundRequest && selectedOrder.refundRequest.imageUrls && 
                     Array.isArray(selectedOrder.refundRequest.imageUrls) && 
                     selectedOrder.refundRequest.imageUrls.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Hình ảnh đã tải lên:</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {selectedOrder.refundRequest.imageUrls.map((url: string, index: number) => {
                            // Generate multiple URL attempts
                            const urlAttempts = prepareImageUrl(url);
                            
                            return (
                              <Box 
                                key={index}
                                sx={{ 
                                  width: 100, 
                                  height: 100, 
                                  position: 'relative',
                                  border: '1px solid #ddd',
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  overflow: 'hidden',
                                  backgroundColor: '#f5f5f5'
                                }}
                                onClick={(e) => {
                                  e.preventDefault(); 
                                  e.stopPropagation();
                                  // Open the first valid URL
                                  openImagePreview(urlAttempts[0]);
                                }}
                              >
                                <img
                                  src={urlAttempts[0]}
                                  alt={`Refund evidence ${index + 1}`}
                                  style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '100%', 
                                    objectFit: 'cover'
                                  }}
                                  onError={(e) => handleImageError(e, urlAttempts)}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </Box>
              
              <TextField
                label="Ghi chú của admin"
                multiline
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Thêm ghi chú về quyết định hoàn tiền này (không bắt buộc)"
              />
            </DialogContent>
            <DialogActions>
              <Stack direction="row" spacing={2}>
                <Button 
                  onClick={handleCloseRefundDialog} 
                  disabled={refundProcessing}
                >
                  Hủy
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleRefundRequest(selectedOrder.id, 'REJECTED')}
                  disabled={refundProcessing}
                >
                  Từ chối hoàn tiền
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleRefundRequest(selectedOrder.id, 'APPROVED')}
                  disabled={refundProcessing}
                >
                  Chấp nhận hoàn tiền
                </Button>
              </Stack>
              {refundProcessing && <CircularProgress size={24} sx={{ ml: 2 }} />}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminOrders;