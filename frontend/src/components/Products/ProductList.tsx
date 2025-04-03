import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Rating,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  CardActions,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import { Product } from '../../types/product';
import ProductService from '../../services/productService';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

interface ProductListProps {
  categoryFilter?: string;
  searchTerm?: string;
  sortBy?: string;
}

const ProductList: React.FC<ProductListProps> = ({ 
  categoryFilter = 'all', 
  searchTerm = '', 
  sortBy = 'newest' 
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await ProductService.getAllProducts({
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          search: searchTerm || undefined,
          sort: sortBy || undefined
        });
        setProducts(response.data);
      } catch (err) {
        console.error('Error fetching products:', err);
        // Nếu không có sản phẩm, hiển thị sản phẩm mẫu
        setProducts([
          {
            id: "1",
            name: "Smartphone",
            description: "Latest model smartphone with advanced features",
            price: 799.99,
            imageUrl: "https://via.placeholder.com/300x200?text=Smartphone",
            category: "Electronics",
            stock: 50,
            rating: 4.5,
            reviews: []
          },
          {
            id: "2",
            name: "Laptop",
            description: "Powerful laptop for work and entertainment",
            price: 1299.99,
            imageUrl: "https://via.placeholder.com/300x200?text=Laptop",
            category: "Electronics",
            stock: 30,
            rating: 4.7,
            reviews: []
          },
          {
            id: "3",
            name: "SmartWatch",
            description: "Track your fitness and stay connected",
            price: 249.99,
            imageUrl: "https://via.placeholder.com/300x200?text=SmartWatch",
            category: "Accessories",
            stock: 100,
            rating: 4.2,
            reviews: []
          },
          {
            id: "4",
            name: "Headphones",
            description: "Noise cancelling wireless headphones",
            price: 199.99,
            imageUrl: "https://via.placeholder.com/300x200?text=Headphones",
            category: "Audio",
            stock: 75,
            rating: 4.4,
            reviews: []
          }
        ]);
        // Không hiển thị lỗi cho người dùng khi API không phản hồi
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryFilter, searchTerm, sortBy]);

  useEffect(() => {
    // Load favorites if user is authenticated
    const loadFavorites = async () => {
      if (isAuthenticated) {
        try {
          const response = await ProductService.getFavorites();
          // Lấy IDs từ danh sách sản phẩm yêu thích
          const favoriteIds = response.data.map((product: Product) => product.id);
          setFavorites(favoriteIds);
        } catch (err) {
          console.error('Error loading favorites:', err);
          // Không hiển thị lỗi, chỉ log cho mục đích debug
          setFavorites([]);
        }
      }
    };

    loadFavorites();
  }, [isAuthenticated]);

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleAddToCart = (event: React.MouseEvent, product: Product) => {
    event.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1
    });
    showSnackbar('Product added to cart', 'success');
  };

  const handleToggleFavorite = async (event: React.MouseEvent, productId: string) => {
    event.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      if (favorites.includes(productId)) {
        await ProductService.removeFromFavorites(productId);
        setFavorites(favorites.filter(id => id !== productId));
        showSnackbar('Removed from favorites', 'success');
      } else {
        await ProductService.addToFavorites(productId);
        setFavorites([...favorites, productId]);
        showSnackbar('Added to favorites', 'success');
      }
    } catch (err) {
      console.error('Error updating favorites:', err);
      showSnackbar('Failed to update favorites', 'error');
    }
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Box textAlign="center" my={4}>
        <Typography variant="h6">No products found</Typography>
        <Typography color="textSecondary">Try a different search term or filter</Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6
                },
                position: 'relative'
              }}
              onClick={() => handleProductClick(product.id)}
            >
              <CardMedia
                component="img"
                height="200"
                image={product.imageUrl}
                alt={product.name}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="h2" noWrap>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {product.description}
                </Typography>
                <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
                  <Rating value={product.rating} readOnly precision={0.5} />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({product.reviews.length})
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" color="primary">
                    ${product.price.toFixed(2)}
                  </Typography>
                  <Chip 
                    label={product.stock > 0 ? 'In Stock' : 'Out of Stock'} 
                    color={product.stock > 0 ? 'success' : 'error'} 
                    size="small" 
                  />
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', padding: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  disabled={product.stock === 0}
                  onClick={(e) => handleAddToCart(e, product)}
                >
                  Add to Cart
                </Button>
                <Tooltip title={favorites.includes(product.id) ? "Remove from favorites" : "Add to favorites"}>
                  <IconButton 
                    color="primary" 
                    onClick={(e) => handleToggleFavorite(e, product.id)}
                  >
                    {favorites.includes(product.id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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
    </>
  );
};

export default ProductList; 