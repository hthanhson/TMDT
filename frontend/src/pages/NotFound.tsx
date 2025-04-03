import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';

const NotFound: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          py: 5,
        }}
      >
        <Typography variant="h1" color="primary" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          Trang Không Tìm Thấy
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
        </Typography>
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            component={RouterLink}
            to="/"
            color="primary"
            size="large"
          >
            Quay Lại Trang Chủ
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default NotFound; 