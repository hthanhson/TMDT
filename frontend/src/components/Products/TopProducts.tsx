import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Chip,
  Rating,
  Skeleton,
} from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Product } from '../../types/product';
import ProductService from '../../services/productService';
import { formatCurrency } from '../../utils/formatters';

interface TopProductsProps {
  title?: string;
  maxItems?: number;
}

const TopProducts: React.FC<TopProductsProps> = ({ 
  title = 'Sản Phẩm Bán Chạy Nhất', 
  maxItems = 8
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        // In production, uncomment and use the API call
        const response = await ProductService.getTopProducts(maxItems);
        setProducts(response.data.map(product => ({
          ...product,
          // Ensure nested objects are handled properly
          category: typeof product.category === 'object' ? 
            (product.category ? (
              typeof product.category === 'object' && product.category !== null && 'name' in product.category 
                ? (product.category as {name: string}).name 
                : JSON.stringify(product.category)
            ) : '') : 
            product.category,
          rating: typeof product.rating === 'object' ? 0 : product.rating,
        })));
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching top products:', err);
        setError('Failed to load top products');
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [maxItems]);

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  if (error) {
    return (
      <Box my={4}>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h5" component="h2" gutterBottom>
          {title}
        </Typography>
      )}
      
      {loading ? (
        <Grid container spacing={2}>
          {Array.from(new Array(2)).map((_, index) => (
            <Grid item xs={12} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton width="80%" />
                  <Skeleton width="40%" />
                  <Skeleton width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {/* Display as stack for sidebar view */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid item xs={12} key={product.id}>
                  <Card 
                    sx={{ 
                      display: 'flex',
                      height: '100%',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleProductClick(product.id)} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <CardMedia
                        component="img"
                        sx={{ width: 100, height: 100, objectFit: 'cover' }}
                        image={product.imageUrl}
                        alt={product.name}
                      />
                      <CardContent sx={{ flex: '1 0 auto', p: 2 }}>
                        <Typography variant="subtitle1" component="h3" noWrap>
                          {product.name}
                        </Typography>
                        <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
                          <Rating value={product.rating} readOnly size="small" precision={0.1} />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                            ({typeof product.rating === 'object' ? 0 : product.rating})
                          </Typography>
                        </Box>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(product.price)}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
          
          {/* Display as swiper for mobile view */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000 }}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                },
                768: {
                  slidesPerView: 3,
                },
              }}
            >
              {products.map((product) => (
                <SwiperSlide key={product.id}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    <CardActionArea onClick={() => handleProductClick(product.id)}>
                      <CardMedia
                        component="img"
                        height={160}
                        image={product.imageUrl}
                        alt={product.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="h3" noWrap>
                          {product.name}
                        </Typography>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Rating value={product.rating} readOnly size="small" precision={0.1} />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {typeof product.rating === 'object' ? 0 : product.rating}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" color="primary">
                            {formatCurrency(product.price)}
                          </Typography>
                          <Chip 
                            size="small" 
                            color={product.stock > 10 ? "success" : "error"} 
                            label={product.stock > 0 ? "Còn Hàng" : "Hết Hàng"} 
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </SwiperSlide>
              ))}
            </Swiper>
          </Box>
        </>
      )}
    </Box>
  );
};

export default TopProducts; 