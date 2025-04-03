import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Paper,
  Divider,
  Chip,
  Rating,
  TextField,
  Tabs,
  Tab,
  Skeleton,
  Stack,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
  Description as DescriptionIcon,
  Reviews as ReviewsIcon,
} from '@mui/icons-material';
import ProductService from '../services/productService';
import { Product } from '../types/product';
import { useCart } from '../contexts/CartContext';
import TopProducts from '../components/Products/TopProducts';
import { useAuth } from '../contexts/AuthContext';
import ReviewForm from '../components/Products/ReviewForm';
import api from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const processProduct = (product: any) => {
    // Process fields that might be objects
    return {
      ...product,
      category: typeof product.category === 'object' ? 
        (product.category ? (
          typeof product.category === 'object' && product.category !== null && 'name' in product.category 
            ? (product.category as {name: string}).name 
            : JSON.stringify(product.category)
        ) : '') : 
        product.category,
      description: typeof product.description === 'object' ? 
        JSON.stringify(product.description) : 
        product.description
    };
  };

  const fetchProduct = async () => {
    try {
      if (!productId) {
        setError('Product ID is missing');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const response = await ProductService.getProductById(productId as string);
      
      // Process the product to handle any object fields
      const processedProduct = processProduct(response.data);
      setProduct(processedProduct);
      
      // Check if product is in wishlist
      if (isAuthenticated) {
        try {
          const wishlistResponse = await ProductService.checkInFavorites(productId as string);
          setInWishlist(wishlistResponse.data);
        } catch (err) {
          console.error('Error checking wishlist status:', err);
        }
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching product:', err);
      setError(err.response?.data?.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId, isAuthenticated]);

  const handleQuantityChange = (value: number) => {
    if (product && value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantity
      });
      setAddedToCart(true);
      setTimeout(() => {
        setAddedToCart(false);
      }, 3000);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      showSnackbar('Please log in to save favorites', 'error');
      setTimeout(() => {
        navigate('/login', { state: { from: `/products/${productId}` } });
      }, 1500);
      return;
    }
    
    try {
      if (inWishlist) {
        await ProductService.removeFromFavorites(productId as string);
        setInWishlist(false);
        showSnackbar('Removed from favorites', 'success');
      } else {
        await ProductService.addToFavorites(productId as string);
        setInWishlist(true);
        showSnackbar('Added to favorites', 'success');
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      showSnackbar('Failed to update favorites. Please try again after logging in.', 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Skeleton variant="text" height={60} />
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" height={40} />
              <Skeleton variant="text" height={100} />
              <Skeleton variant="rectangular" height={50} width="80%" />
              <Skeleton variant="rectangular" height={50} />
            </Stack>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Product not found'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {addedToCart && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Product added to cart successfully!
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Product Image */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, position: 'relative' }}>
            <IconButton
              onClick={handleToggleWishlist}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                bgcolor: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                },
                zIndex: 1,
              }}
              color={inWishlist ? 'error' : 'default'}
              aria-label="add to favorites"
            >
              {inWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
            <Box
              component="img"
              src={product.imageUrl}
              alt={product.name}
              sx={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          </Paper>
        </Grid>

        {/* Product Details */}
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {product.name}
            </Typography>

            <Box display="flex" alignItems="center" mb={2}>
              <Rating value={product.rating} precision={0.1} readOnly />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({product.reviews.length} reviews)
              </Typography>
            </Box>

            <Typography variant="h5" color="primary" gutterBottom>
              ${product.price.toFixed(2)}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" paragraph>
              {product.description}
            </Typography>

            <Box display="flex" alignItems="center" mb={3}>
              <Chip
                label={product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                color={product.stock > 0 ? 'success' : 'error'}
                variant="outlined"
                sx={{ mr: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                Category: {product.category}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" mb={3}>
              <TextField
                type="number"
                label="Quantity"
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) handleQuantityChange(value);
                }}
                InputProps={{ inputProps: { min: 1, max: product.stock } }}
                disabled={product.stock === 0}
                size="small"
                sx={{ width: 100, mr: 2 }}
              />

              <Button
                variant="contained"
                startIcon={<CartIcon />}
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                sx={{ mr: 1 }}
              >
                Thêm Vào Giỏ Hàng
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={inWishlist ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                onClick={handleToggleWishlist}
                sx={{ mr: 1 }}
              >
                {inWishlist ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Product Tabs */}
      <Box sx={{ width: '100%', mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="product tabs">
            <Tab label="Mô Tả" id="product-tab-0" />
            <Tab label="Đánh Giá" id="product-tab-1" />
            <Tab label="Vận Chuyển & Đổi Trả" id="product-tab-2" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <Typography variant="body1" paragraph>
            {typeof product.description === 'object' ? 
              JSON.stringify(product.description) : 
              product.description}
          </Typography>
          <Typography variant="body1" paragraph>
            {product.name} được thiết kế để đáp ứng mọi nhu cầu của bạn. Sản phẩm mang đến hiệu suất vượt trội, thiết kế sang trọng, và giá trị đồng tiền tuyệt vời.
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Tính năng nổi bật:
          </Typography>
          <ul>
            <li>Chất lượng cao và vật liệu bền bỉ</li>
            <li>Hiệu suất vượt trội</li>
            <li>Bảo hành mở rộng</li>
            <li>Hỗ trợ khách hàng 24/7</li>
          </ul>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Đánh Giá Từ Khách Hàng
          </Typography>
          
          {isAuthenticated && (
            <ReviewForm 
              productId={productId as string} 
              onReviewSubmitted={() => {
                // Refresh product data to show the new review
                fetchProduct();
              }} 
            />
          )}
          
          {product.reviews.length > 0 ? (
            <Box>
              {product.reviews.map((review) => (
                <Card key={review.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6">
                        {review.userName}
                      </Typography>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {new Date(review.date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1">
                      {typeof review.comment === 'object' ? 
                        JSON.stringify(review.comment) : 
                        review.comment}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography>Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</Typography>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Thông Tin Vận Chuyển
          </Typography>
          <Typography variant="body1" paragraph>
            Chúng tôi cung cấp các phương thức vận chuyển sau:
          </Typography>
          <ul>
            <li>Vận chuyển tiêu chuẩn (3-5 ngày làm việc): Miễn phí cho đơn hàng trên 1.200.000đ</li>
            <li>Vận chuyển nhanh (1-2 ngày làm việc): 200.000đ</li>
            <li>Giao hàng trong ngày: 350.000đ</li>
          </ul>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>
            Chính Sách Đổi Trả
          </Typography>
          <Typography variant="body1" paragraph>
            Chúng tôi chấp nhận đổi trả trong vòng 30 ngày kể từ ngày mua. Sản phẩm phải còn nguyên trạng với đầy đủ nhãn mác và bao bì.
          </Typography>
          <Typography variant="body1">
            Để biết thêm chi tiết, vui lòng tham khảo chính sách đổi trả đầy đủ của chúng tôi.
          </Typography>
        </TabPanel>
      </Box>

      {/* Related Products */}
      <Box mt={6}>
        <TopProducts title="Sản Phẩm Tương Tự" maxItems={4} />
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetail; 