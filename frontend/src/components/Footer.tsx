import React from 'react';
import { Box, Container, Typography, Link, Grid, Divider } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              TMDT Shop
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Điểm đến mua sắm tuyệt vời cho mọi nhu cầu của bạn.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Liên Kết Nhanh
            </Typography>
            <Link href="/" color="inherit" display="block" sx={{ mb: 1 }}>
              Trang Chủ
            </Link>
            <Link href="/products" color="inherit" display="block" sx={{ mb: 1 }}>
              Sản Phẩm
            </Link>
            <Link href="/about" color="inherit" display="block" sx={{ mb: 1 }}>
              Về Chúng Tôi
            </Link>
            <Link href="/contact" color="inherit" display="block" sx={{ mb: 1 }}>
              Liên Hệ
            </Link>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Liên Hệ Với Chúng Tôi
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              123 Đường Chính
              <br />
              Quận 1, TP. Hồ Chí Minh
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: info@tmdtshop.com
              <br />
              Điện thoại: +84 123 456 789
            </Typography>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} TMDT Shop. Tất cả các quyền được bảo lưu.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 