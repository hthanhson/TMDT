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
  Snackbar
} from '@mui/material';
import ProductService from '../../services/productService';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onReviewSubmitted }) => {
  const [rating, setRating] = useState<number | null>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Vui lòng cung cấp đánh giá');
      return;
    }
    
    if (!comment.trim()) {
      setError('Vui lòng cung cấp nhận xét');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await ProductService.addReview(productId, {
        rating,
        comment
      });
      
      // Reset form
      setRating(0);
      setComment('');
      setSuccess(true);
      
      // Notify parent that a review was submitted
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Viết Đánh Giá
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Box>
            <Typography component="legend">Đánh Giá Của Bạn</Typography>
            <Rating
              name="rating"
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              precision={1}
              size="large"
            />
          </Box>
          
          <TextField
            label="Nhận Xét Của Bạn"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            placeholder="Chia sẻ trải nghiệm của bạn với sản phẩm này..."
          />
          
          <Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Đang Gửi...' : 'Gửi Đánh Giá'}
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
          Đánh giá đã được gửi thành công! Cảm ơn bạn đã góp ý.
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ReviewForm; 