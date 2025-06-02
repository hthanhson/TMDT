import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  FormHelperText,
  ImageList,
  ImageListItem,
  Modal,
} from '@mui/material';
import { format } from 'date-fns';
import { PhotoCamera } from '@mui/icons-material';
import OrderService from '../services/OrderService';
import NotificationService from '../services/NotificationService';
import { refreshHeaderNotifications } from '../components/Header';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Order } from '../types/order';

// Định nghĩa các trạng thái cho quy trình hoàn tiền
const RefundStatus = {
  REQUESTED: 'REQUESTED',
  REVIEWING: 'REVIEWING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED'
};

// Định nghĩa các bước trong quy trình hoàn tiền
const refundSteps = ['Yêu cầu hoàn tiền', 'Đang xem xét', 'Hoàn tiền thành công'];

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { refreshNotifications } = useNotification();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<boolean>(false);
  
  // State cho chức năng hoàn tiền
  const [openRefundDialog, setOpenRefundDialog] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundImages, setRefundImages] = useState<File[]>([]);
  const [refundImagePreviews, setRefundImagePreviews] = useState<string[]>([]);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [refundAdditionalInfo, setRefundAdditionalInfo] = useState('');
  const [reasonError, setReasonError] = useState(false);

  // Add state for viewing refund images
  const [refundImagesUrls, setRefundImagesUrls] = useState<string[]>([]);
  const [openImageViewer, setOpenImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!id) return;
        
        const response = await OrderService.getOrderById(id);
        setOrder(response.data);
        
        // Backend server URL
        const backendUrl = 'http://localhost:8080';
        
        // If order has refund images, set the URLs
        // Check both direct refundImages property and refundRequest.imageUrls
        if (response.data.refundImages && response.data.refundImages.length > 0) {
          // Log the original images
          console.log("Original refundImages from backend:", response.data.refundImages);
          
          const imageUrls = response.data.refundImages.map((image: string) => {
            // Use the correct file serving endpoint
            if (!image.includes('/')) {
              return `${backendUrl}/api/files/${image}`;
            }
            return image.startsWith('http') ? image : `${backendUrl}${image.startsWith('/') ? '' : '/'}${image}`;
          });
          setRefundImagesUrls(imageUrls);
          console.log("Prepared refund image URLs:", imageUrls);
        } else if (response.data.refundRequest && response.data.refundRequest.imageUrls && 
                  response.data.refundRequest.imageUrls.length > 0) {
          // Log the original images from refund request
          console.log("Original refundRequest.imageUrls from backend:", response.data.refundRequest.imageUrls);
          
          const imageUrls = response.data.refundRequest.imageUrls.map((image: string) => {
            // Use the correct file serving endpoint
            if (!image.includes('/')) {
              return `${backendUrl}/api/files/${image}`;
            }
            return image.startsWith('http') ? image : `${backendUrl}${image.startsWith('/') ? '' : '/'}${image}`;
          });
          setRefundImagesUrls(imageUrls);
          console.log("Prepared refund request image URLs:", imageUrls);
        }
        
        // Kiểm tra nếu đơn hàng đã có yêu cầu hoàn tiền, cập nhật step hiện tại
        if (response.data.refundStatus) {
          switch (response.data.refundStatus) {
            case RefundStatus.REQUESTED:
              setActiveStep(1);
              break;
            case RefundStatus.REVIEWING:
              setActiveStep(2);
              break;
            case RefundStatus.APPROVED:
              setActiveStep(3); // Hoàn tiền thành công
              break;
            case RefundStatus.COMPLETED:
              setActiveStep(3); // Hoàn tiền thành công
              break;
            case RefundStatus.REJECTED:
              // Trong trường hợp bị từ chối, không cập nhật step
              setActiveStep(1);
              break;
            default:
              setActiveStep(0);
          }
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrder();
    } else {
      navigate('/login', { state: { from: `/orders/${id}` } });
    }
  }, [id, isAuthenticated, navigate]);

  const handleCancelOrder = async () => {
    try {
      if (!id) return;
      
      // First, cancel the order
      await OrderService.cancelOrder(Number(id));

      // Hoàn tiền vào tài khoản
      try {
        await OrderService.refundOrder(Number(id));
        setRefundSuccess(true);
      } catch (refundErr) {
        console.error('Error refunding order:', refundErr);
        // Vẫn tiếp tục với việc hủy đơn hàng ngay cả khi hoàn tiền thất bại
      }
      
      // After successful order cancellation, use multiple approaches to refresh notifications
      console.log("Order cancelled successfully, refreshing notifications...");
      
      // 1. Call the global refresh function from Header component
      refreshHeaderNotifications();
      
      // 2. Call the context refresh function (most reliable approach)
      await refreshNotifications();
      
      // 3. Direct service call with small delay as a fallback
      setTimeout(() => {
        try {
          NotificationService.getNotifications()
            .then(response => {
              console.log("Manually fetched notifications after cancel:", response.data.length);
            })
            .catch(error => {
              console.error("Error manually fetching notifications:", error);
            });
        } catch (err) {
          console.error('Failed manual notification refresh:', err);
        }
      }, 300);
      
      // Refresh order data
      const response = await OrderService.getOrderById(id);
      setOrder(response.data);
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      setError(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  // Mở dialog yêu cầu hoàn tiền
  const handleOpenRefundDialog = () => {
    setOpenRefundDialog(true);
    setRefundReason('');
    setRefundImages([]);
    setRefundImagePreviews([]);
    setRefundError(null);
  };

  // Xử lý khi người dùng tải ảnh lên
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileArray = Array.from(event.target.files);
      
      // Giới hạn tối đa 3 ảnh
      const newFiles = [...refundImages, ...fileArray].slice(0, 3);
      setRefundImages(newFiles);
      
      // Tạo URL preview cho ảnh
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      
      // Xóa các URL preview cũ để tránh memory leak
      refundImagePreviews.forEach(url => URL.revokeObjectURL(url));
      
      setRefundImagePreviews(newPreviews);
    }
  };

  // Xóa ảnh đã chọn
  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(refundImagePreviews[index]);
    
    const newImages = [...refundImages];
    newImages.splice(index, 1);
    setRefundImages(newImages);
    
    const newPreviews = [...refundImagePreviews];
    newPreviews.splice(index, 1);
    setRefundImagePreviews(newPreviews);
  };

  // Gửi yêu cầu hoàn tiền
  const handleSubmitRefund = async () => {
    // Validate form
    if (!refundReason.trim()) {
      setReasonError(true);
      return;
    }
    
    setReasonError(false);
    setRefundLoading(true);
    setRefundError(null);
    
    try {
      if (!id) return;
      
      const formData = new FormData();
      formData.append('reason', refundReason);
      formData.append('additionalInfo', refundAdditionalInfo);
      
      // Thêm ảnh vào formData
      refundImages.forEach((image, index) => {
        formData.append('images', image);
      });
      
      // Gọi API để tạo yêu cầu hoàn tiền
      await OrderService.requestRefund(Number(id), formData);
      
      // Cập nhật UI
      setRefundSuccess(true);
      setOpenRefundDialog(false);
      setActiveStep(1); // Cập nhật trạng thái sang "Đang xem xét"
      
      // Refresh thông báo
      refreshHeaderNotifications();
      await refreshNotifications();
      
      // Refresh dữ liệu đơn hàng
      const response = await OrderService.getOrderById(id);
      setOrder(response.data);
      
    } catch (err: any) {
      console.error('Error requesting refund:', err);
      setRefundError(err.response?.data?.message || 'Failed to request refund');
    } finally {
      setRefundLoading(false);
    }
  };

  // Hàm để lấy các bước hoàn tiền dựa vào trạng thái hiện tại
  const getRefundSteps = () => {
    if (order?.refundStatus === 'REJECTED') {
      return ['Yêu cầu hoàn tiền', 'Đang xem xét', 'Hoàn tiền thất bại'];
    }
    return ['Yêu cầu hoàn tiền', 'Đang xem xét', 'Hoàn tiền thành công'];
  };

  // Function to handle opening the image viewer
  const handleOpenImageViewer = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setOpenImageViewer(true);
  };

  // Function to close the image viewer
  const handleCloseImageViewer = () => {
    setOpenImageViewer(false);
    setSelectedImage('');
  };

  // Function to handle image load errors
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>, imageUrl: string) => {
    const imgElement = event.currentTarget;
    console.error(`Failed to load image: ${imageUrl}`);
    
    // Backend server URL
    const backendUrl = 'http://localhost:8080';
    
    // Try alternative paths
    const alternativeUrls = [
      `http://localhost:8080/uploads/refunds/${imageUrl.split('/').pop()}`,

    ];
    
    // Try the next URL in the list
    if (imgElement.dataset.retryCount === undefined) {
      imgElement.dataset.retryCount = "0";
    }
    
    const retryCount = parseInt(imgElement.dataset.retryCount);
    if (retryCount < alternativeUrls.length) {
      console.log(`Retrying with alternative URL: ${alternativeUrls[retryCount]}`);
      imgElement.src = alternativeUrls[retryCount];
      imgElement.dataset.retryCount = (retryCount + 1).toString();
    } else {
      // Use a default placeholder after all retries failed
      // imgElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3EImage Error%3C/text%3E%3C/svg%3E";
    }
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
        <Typography color="error" align="center">
          {error}
        </Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" onClick={() => navigate('/orders')}>
            Quay lại danh sách đơn hàng
          </Button>
        </Box>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box my={4}>
        <Typography align="center">Không tìm thấy đơn hàng</Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" onClick={() => navigate('/orders')}>
            Quay lại danh sách đơn hàng
          </Button>
        </Box>
      </Box>
    );
  }

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
      default:
        return 'default';
    }
  };

  const getStatusTranslation = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'PROCESSING':
        return 'Sẵn sàng giao hàng';
      case 'READY_TO_SHIP':
        return 'Sẵn sàng giao hàng';
      case 'SHIPPED':
        return 'Đang giao hàng';
      case 'IN_TRANSIT':
        return 'Đang vận chuyển';
      case 'ARRIVED_AT_STATION':
        return 'Đã đến trạm';
      case 'OUT_FOR_DELIVERY':
        return 'Đang giao hàng';
      case 'DELIVERED':
        return 'Đã giao hàng';
      case 'COMPLETED':
        return 'Hoàn tất';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'RETURNED':
        return 'Đã trả hàng';
      default:
        return status;
    }
  };

  // Kiểm tra xem đơn hàng có đủ điều kiện để yêu cầu hoàn tiền không
  const canRequestRefund = order.status === 'DELIVERED' || order.status === 'COMPLETED';
  
  // Kiểm tra xem đã có yêu cầu hoàn tiền chưa
  const hasRefundRequest = order.refundStatus !== undefined && order.refundStatus !== null;

  // Kiểm tra trạng thái hiển thị refund
  const getRefundStatusDisplay = () => {
    if (!order?.refundStatus) return null;
    
    let label = '';
    let color: 'error' | 'warning' | 'success' | 'info' = 'info';
    
    switch (order.refundStatus) {
      case 'REQUESTED':
        label = 'Yêu cầu đang chờ xử lý';
        color = 'warning';
        break;
      case 'REVIEWING':
        label = 'Đang xem xét';
        color = 'info';
        break;
      case 'APPROVED':
        label = 'Refund Complete';
        color = 'success';
        break;
      case 'COMPLETED':
        label = 'Refund Complete';
        color = 'success';
        break;
      case 'REJECTED':
        label = 'Yêu cầu bị từ chối';
        color = 'error';
        break;
      default:
        return null;
    }
    
    return { label, color };
  };

  return (
    <Box my={4}>
      {refundSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {order.status === 'CANCELLED' 
            ? 'Đơn hàng đã được hủy và số tiền đã được hoàn trả vào tài khoản của bạn.'
            : 'Yêu cầu hoàn tiền của bạn đã được gửi thành công và đang được xử lý.'}
        </Alert>
      )}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Đơn hàng #{order.id}</Typography>
        <Chip
          label={getStatusTranslation(order.status)}
          color={getStatusColor(order.status)}
          variant="outlined"
        />
      </Box>

      {/* Hiển thị stepper cho quy trình hoàn tiền nếu đã có yêu cầu */}
      {hasRefundRequest && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Trạng thái yêu cầu hoàn tiền
            {order.refundStatus === 'APPROVED' || order.refundStatus === 'COMPLETED' ? (
              <Chip 
                label="Refund Complete" 
                color="success" 
                size="small" 
                sx={{ ml: 2 }}
              />
            ) : order.refundStatus === 'REJECTED' ? (
              <Chip 
                label="Refund Failed" 
                color="error" 
                size="small" 
                sx={{ ml: 2 }}
              />
            ) : null}
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 2 }}>
            {getRefundSteps().map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Display refund reason if available */}
          {(order.refundReason || (order.refundRequest && order.refundRequest.reason)) && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: 'bold' }}>
                Lý do hoàn tiền:
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                {order.refundReason || (order.refundRequest && order.refundRequest.reason)}
              </Typography>
            </>
          )}
          
          {/* Display refund images if available */}
          {refundImagesUrls.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: 'bold' }}>
                Hình ảnh đính kèm:
              </Typography>
              <ImageList sx={{ mt: 1 }} cols={3} rowHeight={120}>
                {refundImagesUrls.map((imageUrl, index) => (
                  <ImageListItem 
                    key={index} 
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleOpenImageViewer(imageUrl)}
                  >
                    <img
                      src={imageUrl}
                      alt={`Refund image ${index + 1}`}
                      loading="lazy"
                      style={{ height: '100%', objectFit: 'cover' }}
                      onError={(event) => {
                        console.error(`Failed to load image: ${imageUrl}`);
                        // Try alternative paths
                        const alternativeUrls = [
                          `http://localhost:8080/uploads/refunds/${imageUrl.split('/').pop()}`,
                        ];
                        
                        const imgElement = event.currentTarget;
                        // Try the next URL in the list
                        if (imgElement.dataset.retryCount === undefined) {
                          imgElement.dataset.retryCount = "0";
                        }
                        
                        const retryCount = parseInt(imgElement.dataset.retryCount);
                        if (retryCount < alternativeUrls.length) {
                          console.log(`Retrying with alternative URL ${retryCount + 1}: ${alternativeUrls[retryCount]}`);
                          imgElement.src = alternativeUrls[retryCount];
                          imgElement.dataset.retryCount = (retryCount + 1).toString();
                        } else {
                          // Use a default placeholder after all retries failed
                          imgElement.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3EImage Error%3C/text%3E%3C/svg%3E";
                        }
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </>
          )}
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sản phẩm đã đặt
            </Typography>
            <List>
              {order.orderItems?.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemText
                    primary={item.productName}
                    secondary={`Số lượng: ${item.quantity}`}
                  />
                  <Typography>
                    {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Paper>

          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            {(order.status === 'PENDING' || order.status === 'READY_TO_SHIP') && (
              <Button
                variant="contained"
                color="error"
                onClick={handleCancelOrder}
              >
                Hủy đơn hàng
              </Button>
            )}
            
            {canRequestRefund && !hasRefundRequest && (
              <Button
                variant="contained"
                color="warning"
                onClick={handleOpenRefundDialog}
              >
                Yêu cầu trả hàng - hoàn tiền
              </Button>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="body1">Ngày đặt:</Typography>
                <Typography variant="body1">
                  {format(new Date(order.createdAt), 'PPP')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="body1">Phương thức thanh toán:</Typography>
                <Typography variant="body1">{order.paymentMethod}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="body1">Trạng thái thanh toán:</Typography>
                <Chip
                  label={order.paymentStatus}
                  color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Địa chỉ giao hàng
              </Typography>
              <Typography variant="body2">{order.shippingAddress}</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="h6">Tổng cộng:</Typography>
                <Typography variant="h6">
                  {formatCurrency(order.totalAmount)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-start" mt={3}>
        <Button variant="outlined" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </Box>

      {/* Image viewer modal */}
      <Modal
        open={openImageViewer}
        onClose={handleCloseImageViewer}
        aria-labelledby="image-viewer-modal"
        aria-describedby="view-refund-image-in-full-size"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box 
          sx={{ 
            position: 'relative',
            maxWidth: '90%',
            maxHeight: '90%',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 1,
            outline: 'none',
          }}
        >
          <IconButton
            aria-label="close"
            onClick={handleCloseImageViewer}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.7)',
              },
            }}
          >
            &times;
          </IconButton>
          <img
            src={selectedImage}
            alt="Enlarged refund image"
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(90vh - 40px)',
              objectFit: 'contain',
              display: 'block',
            }}
            onError={(event) => handleImageError(event, selectedImage)}
          />
        </Box>
      </Modal>

      {/* Dialog yêu cầu hoàn tiền */}
      <Dialog 
        open={openRefundDialog} 
        onClose={() => setOpenRefundDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Yêu cầu hoàn tiền</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Vui lòng cung cấp lý do và ảnh chụp sản phẩm (nếu cần) để yêu cầu hoàn tiền cho đơn hàng #{order.id}.
            </Typography>
            
            <TextField
              label="Lý do hoàn tiền"
              multiline
              rows={4}
              fullWidth
              required
              value={refundReason}
              onChange={(e) => {
                setRefundReason(e.target.value);
                if (e.target.value.trim()) setReasonError(false);
              }}
              error={reasonError}
              helperText={reasonError ? "Vui lòng nhập lý do hoàn tiền" : ""}
              margin="normal"
            />
            
            <TextField
              label="Thông tin bổ sung (tùy chọn)"
              multiline
              rows={2}
              fullWidth
              value={refundAdditionalInfo}
              onChange={(e) => setRefundAdditionalInfo(e.target.value)}
              margin="normal"
            />
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                Tải lên ảnh chụp sản phẩm (tối đa 3 ảnh)
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCamera />}
                  disabled={refundImages.length >= 3}
                >
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleImageUpload}
                  />
                </Button>
                <Typography variant="body2" sx={{ ml: 2 }}>
                  {refundImages.length}/3 ảnh đã chọn
                </Typography>
              </Box>
              
              {/* Hiển thị preview ảnh */}
              {refundImagePreviews.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {refundImagePreviews.map((preview, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        border: '1px solid #ccc',
                        borderRadius: 1,
                      }}
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          color: 'error.main',
                          bgcolor: 'background.paper',
                          border: '1px solid currentColor',
                          '&:hover': { bgcolor: 'error.light', color: 'white' },
                        }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        &times;
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
              
              <FormHelperText>
                Ảnh chụp sẽ giúp chúng tôi xử lý yêu cầu hoàn tiền của bạn nhanh hơn.
              </FormHelperText>
            </Box>
            
            {refundError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {refundError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRefundDialog(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitRefund}
            disabled={refundLoading}
          >
            {refundLoading ? <CircularProgress size={24} /> : 'Gửi yêu cầu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetail; 