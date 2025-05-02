import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Rating,
  Box,
  Button,
  IconButton,
  Chip,
  Tooltip,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  BrokenImage as BrokenImageIcon
} from '@mui/icons-material';
import { Product } from '../../types/product';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import ProductService from '../../services/productService';

interface ProductCardProps {
  product: Product;
}

// URL de imagem padrão quando a imagem do produto não está disponível
const DEFAULT_IMAGE_URL = '/assets/images/product-placeholder.jpg';

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [imageError, setImageError] = useState(false);

  // Verificar se o produto está nos favoritos quando o componente montar
  React.useEffect(() => {
    const checkFavorite = async () => {
      if (isAuthenticated) {
        try {
          const response = await ProductService.checkInFavorites(product.id);
          setIsFavorite(response.data);
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavorite();
  }, [product.id, isAuthenticated]);

  const handleProductClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = (event: React.MouseEvent) => {
    event.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: imageError ? DEFAULT_IMAGE_URL : product.imageUrl,
      quantity: 1
    });
  };

  const handleToggleFavorite = async (event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      if (isFavorite) {
        await ProductService.removeFromFavorites(product.id);
        setIsFavorite(false);
      } else {
        await ProductService.addToFavorites(product.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error updating favorites:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Formatter para preço em VND
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Verificar se a URL da imagem é válida (não é um exemplo ou placeholder)
  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    return !url.includes('example.com') && 
           !url.startsWith('http://example.com') && 
           !url.startsWith('https://example.com');
  };

  // Determinar qual URL de imagem usar
  const imageUrl = imageError || !isValidImageUrl(product.imageUrl) 
    ? DEFAULT_IMAGE_URL 
    : product.imageUrl;

  return (
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
        cursor: 'pointer'
      }}
      onClick={handleProductClick}
    >
      {imageError || !isValidImageUrl(product.imageUrl) ? (
        <Box 
          sx={{ 
            height: 200, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'grey.100' 
          }}
        >
          <BrokenImageIcon sx={{ fontSize: 80, color: 'grey.500' }} />
        </Box>
      ) : (
        <CardMedia
          component="img"
          height="200"
          image={product.imageUrl}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
          onError={handleImageError}
        />
      )}
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
          <Rating value={product.rating || 0} readOnly precision={0.5} size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.reviews?.length || 0})
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary">
            {formatPrice(product.price)}
          </Typography>
          <Chip 
            label={product.stock > 0 ? 'Còn hàng' : 'Hết hàng'} 
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
          disabled={product.stock <= 0}
          onClick={handleAddToCart}
        >
          Thêm vào giỏ
        </Button>
        <Tooltip title={isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}>
          <IconButton 
            color="primary" 
            onClick={handleToggleFavorite}
          >
            {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default ProductCard; 