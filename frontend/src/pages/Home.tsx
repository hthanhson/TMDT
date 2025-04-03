import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Paper,
} from '@mui/material';
import {
  LocalShipping,
  Security,
  Support,
  Payment,
} from '@mui/icons-material';
import TopProducts from '../components/Products/TopProducts';

const features = [
  {
    icon: <LocalShipping fontSize="large" />,
    title: 'Miễn Phí Vận Chuyển',
    description: 'Miễn phí vận chuyển cho đơn hàng trên 1.200.000đ',
  },
  {
    icon: <Security fontSize="large" />,
    title: 'Thanh Toán An Toàn',
    description: 'Các phương thức thanh toán an toàn & bảo mật',
  },
  {
    icon: <Support fontSize="large" />,
    title: 'Hỗ Trợ 24/7',
    description: 'Đội ngũ hỗ trợ chuyên nghiệp',
  },
  {
    icon: <Payment fontSize="large" />,
    title: 'Đổi Trả Dễ Dàng',
    description: 'Chính sách đổi trả trong 30 ngày',
  },
];

const Home: React.FC = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Chào Mừng Đến Với TMDT Shop
              </Typography>
              <Typography variant="h5" paragraph>
                Điểm đến mua sắm tuyệt vời cho mọi nhu cầu của bạn
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                component={RouterLink}
                to="/products"
                sx={{ mt: 2 }}
              >
                Mua Sắm Ngay
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://via.placeholder.com/600x400?text=Shop+Now"
                alt="Shopping"
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 2,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Top Products Section */}
      <Container maxWidth="lg">
        <TopProducts title="Sản Phẩm Nổi Bật" maxItems={6} />
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  p: 2,
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                <CardContent>
                  <Typography gutterBottom variant="h6" component="h2">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Special Offers Section */}
      <Box sx={{ bgcolor: 'secondary.light', py: 6, mb: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" gutterBottom align="center" color="secondary.contrastText">
            Ưu Đãi Đặc Biệt
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  alignItems: 'center', 
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <Box 
                  component="img" 
                  src="https://via.placeholder.com/200x200?text=Special+Offer" 
                  alt="Special Offer"
                  sx={{ 
                    width: { xs: '100%', sm: 150 }, 
                    height: { xs: 200, sm: 150 }, 
                    mr: { xs: 0, sm: 3 },
                    mb: { xs: 2, sm: 0 },
                    objectFit: 'cover', 
                    borderRadius: { xs: 1, sm: 1 } 
                  }}
                />
                <Box>
                  <Typography variant="h5" gutterBottom color="secondary">
                    Giảm 20%
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Bộ Sưu Tập Mùa Hè
                  </Typography>
                  <Typography variant="body2" paragraph color="text.secondary">
                    Giảm 20% cho tất cả các mặt hàng quần áo mùa hè với mã SUMMER20.
                  </Typography>
                  <Button variant="outlined" color="secondary" component={RouterLink} to="/products?category=fashion">
                    Mua Sắm Ngay
                  </Button>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <Box 
                  component="img" 
                  src="https://via.placeholder.com/200x200?text=Flash+Sale" 
                  alt="Flash Sale"
                  sx={{ 
                    width: { xs: '100%', sm: 150 }, 
                    height: { xs: 200, sm: 150 }, 
                    mr: { xs: 0, sm: 3 },
                    mb: { xs: 2, sm: 0 },
                    objectFit: 'cover', 
                    borderRadius: { xs: 1, sm: 1 } 
                  }}
                />
                <Box>
                  <Typography variant="h5" gutterBottom color="error">
                    Giảm Giá Sốc
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    Thiết Bị Điện Tử
                  </Typography>
                  <Typography variant="body2" paragraph color="text.secondary">
                    Ưu đãi có thời hạn! Giảm đến 30% cho các sản phẩm điện tử được chọn.
                  </Typography>
                  <Button variant="outlined" color="error" component={RouterLink} to="/products?category=electronics">
                    Mua Sắm Ngay
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Danh Mục Phổ Biến
        </Typography>
        <Grid container spacing={4}>
          {['Thiết Bị Điện Tử', 'Thời Trang', 'Nhà Cửa & Đời Sống', 'Sách'].map(
            (category, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  component={RouterLink}
                  to={`/products?category=${category.toLowerCase()}`}
                  sx={{
                    height: '100%',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height={140}
                    image={`https://via.placeholder.com/300x140?text=${category}`}
                    alt={category}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="h3">
                      {category}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 