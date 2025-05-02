import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Box, 
  Typography, 
  Pagination, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Alert
} from '@mui/material';
import ProductCard from './ProductCard';
import ProductService from '../../services/productService';
import { Product } from '../../types/product';

interface ProductListProps {
  products: Product[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
  error?: string | null;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  error = null
}) => {
  // Cálculo para total de páginas
  const totalPages = Math.ceil(totalItems / pageSize);
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value - 1); // API uses 0-based indexing
  };

  const handlePageSizeChange = (event: SelectChangeEvent) => {
    onPageSizeChange(Number(event.target.value));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
    );
  }

  if (products.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {products.map((product) => (
          <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
      
      {totalItems > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 4 
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalItems)} trong số {totalItems} sản phẩm
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="items-per-page-label">Hiển thị</InputLabel>
              <Select
                labelId="items-per-page-label"
                id="items-per-page"
                value={pageSize.toString()}
                label="Hiển thị"
                onChange={handlePageSizeChange}
              >
                <MenuItem value={12}>12 / trang</MenuItem>
                <MenuItem value={24}>24 / trang</MenuItem>
                <MenuItem value={48}>48 / trang</MenuItem>
              </Select>
            </FormControl>
            
            <Pagination 
              count={totalPages} 
              page={page + 1} // UI uses 1-based indexing
              onChange={handlePageChange}
              color="primary" 
              shape="rounded"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ProductList; 