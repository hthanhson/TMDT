import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Rating,
  Snackbar,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Home as HomeIcon,
  FavoriteBorder as FavoriteIcon
} from '@mui/icons-material';
import ProductService from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Product } from '../types/product';
import { formatCurrency } from '../utils/formatters';
import { getProductImageUrl, FALLBACK_IMAGE } from '../utils/imageHelpers';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/wishlist' } });
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const wishlistResponse = await ProductService.getFavorites();
        
        // Đảm bảo mỗi sản phẩm có thuộc tính reviews nếu API không trả về
        const productsWithReviews = wishlistResponse.data.map((product: Product) => ({
          ...product,
          reviews: product.reviews || []
        }));
        
        setFavorites(productsWithReviews);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Không thể tải danh sách yêu thích');
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, navigate]);

  const handleRemoveFromFavorites = async (productId: string) => {
    try {
      await ProductService.removeFromFavorites(productId);
      setFavorites(favorites.filter(product => product.id !== productId));
      showSnackbar('Product removed from favorites', 'success');
    } catch (err) {
      console.error('Error removing from favorites:', err);
      showSnackbar('Failed to remove from favorites', 'error');
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: getProductImageUrl(product.id),
      quantity: 1
    });
    showSnackbar('Product added to cart', 'success');
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" my={8}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 4 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Trang Chủ
        </Link>
        <Typography color="text.primary">Danh Sách Yêu Thích</Typography>
      </Breadcrumbs>
      
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Danh Sách Yêu Thích
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {favorites.length === 0 ? (
          <Box textAlign="center" py={6}>
            <FavoriteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Danh sách yêu thích của bạn đang trống
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              Bắt đầu thêm sản phẩm vào danh sách yêu thích bằng cách nhấp vào biểu tượng trái tim trên các sản phẩm bạn thích.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/products')}
              sx={{ mt: 2 }}
            >
              Khám Phá Sản Phẩm
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {favorites.map((product) => (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={getProductImageUrl(product.id)}
                    onError={(e: any) => (e.currentTarget.src = FALLBACK_IMAGE)}
                    alt={product.name}
                    sx={{ 
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleProductClick(product.id)}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="h2" 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { color: 'primary.main' } 
                      }}
                      onClick={() => handleProductClick(product.id)}
                    >
                      {product.name}
                    </Typography>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Rating value={product.rating} readOnly precision={0.5} />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        ({product.reviews?.length || 0})
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(product.price)}
                    </Typography>
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ justifyContent: 'space-between', padding: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CartIcon />}
                      size="small"
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product)}
                    >
                      Thêm vào giỏ hàng
                    </Button>
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveFromFavorites(product.id)}
                      title="Remove from wishlist"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
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

export default Wishlist; 