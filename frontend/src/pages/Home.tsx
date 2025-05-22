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
                WelCome
              </Typography>
              <Typography variant="h5" paragraph>
               
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
      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          {/* Danh Mục Phổ Biến */}
        </Typography>
        {/* <Grid container spacing={4}>
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
        </Grid> */}
      </Container>
    </Box>
  );
};

export default Home; 