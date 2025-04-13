import React, { useState } from 'react';
import {
  Box,
  Typography,
  Rating,
  TextField,
  Button,
  Paper,
  Stack,
  Alert,
  Snackbar,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import ProductService from '../../services/productService';
import { useAuth } from '../../contexts/AuthContext';
import { Review } from '../../types/product';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
  hasPurchased?: boolean;
  reviews?: Review[];
  onDeleteReview?: (reviewId: string) => Promise<void>;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  productId, 
  onReviewSubmitted, 
  hasPurchased = false,
  reviews = [],
  onDeleteReview
}) => {
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState<number | null>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Get the display name for the current user
  const userDisplayName = user?.fullName || user?.username || 'Người dùng';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submitting review with data:', {
        productId,
        rating,
        comment,
        isAnonymous,
        userId: user?.id
      });
      
      // Sử dụng API phù hợp cho mỗi loại review
      let response;
      if (ProductService.addSimpleReview) {
        // Sử dụng API mới hỗ trợ ẩn danh nếu có
        response = await ProductService.addSimpleReview(productId, {
          rating: rating || 0,
          comment,
          isAnonymous
        });
      } else {
        // Fallback về API cũ nếu không có API mới
        response = await ProductService.addReview(productId, {
          rating: rating || 0,
          comment,
          isAnonymous
        });
      }
      
      console.log('Review submission response:', response);
      
      setSuccess(true);
      setRating(0);
      setComment('');
      // Giữ lại trạng thái ẩn danh cho lần bình luận tiếp theo
      
      // Call the callback to refresh product data
      onReviewSubmitted();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      
      // Xử lý trường hợp người dùng đã bình luận trước đó
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already reviewed')) {
        setError('Bạn đã đánh giá sản phẩm này trước đó. Hệ thống đã được cập nhật để cho phép bình luận nhiều lần.');
      } else {
        setError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  // Xử lý hàm xóa đánh giá
  const handleDeleteReview = async (reviewId: string) => {
    if (onDeleteReview) {
      await onDeleteReview(reviewId);
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Vui lòng đăng nhập để đánh giá sản phẩm này
        </Alert>
      ) : (
        <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Viết Đánh Giá
            </Typography>
            {!isAnonymous && (
              <Typography variant="subtitle2" color="primary.main">
                
              </Typography>
            )}
            {isAnonymous && (
              <Typography variant="subtitle2" color="text.secondary">
                Đánh giá ẩn danh
              </Typography>
            )}
            {hasPurchased && (
              <Typography variant="caption" color="success.main">
                Đã Mua Hàng
              </Typography>
            )}
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box>
                <Typography component="legend" fontWeight="medium" gutterBottom>
                  Đánh Giá Sao *
                </Typography>
                <Rating
                  name="rating"
                  value={rating}
                  onChange={(_, newValue) => {
                    setRating(newValue);
                  }}
                  precision={1}
                  size="large"
                />
              </Box>
              
              <TextField
                label="Nhận Xét Chi Tiết"
                multiline
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                fullWidth
                placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                }
                label="Đăng đánh giá ẩn danh"
              />
              
              <Box display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  endIcon={<SendIcon />}
                >
                  {loading ? <CircularProgress size={24} /> : 'Gửi Đánh Giá'}
                </Button>
              </Box>
            </Stack>
          </Box>
          
          <Snackbar
            open={success}
            autoHideDuration={5000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
              Cảm ơn bạn đã đánh giá sản phẩm!
            </Alert>
          </Snackbar>
        </Paper>
      )}

      {/* Hiển thị danh sách đánh giá */}
      

  
    </>
  );
};

export default ReviewForm; 