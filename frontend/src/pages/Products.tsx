import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
  IconButton,
  InputAdornment,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import ProductList from '../components/Products/ProductList';
import ProductService from '../services/productService';
import { Product } from '../types/product';
import TopProducts from '../components/Products/TopProducts';

// Định nghĩa interface cho Category
interface Category {
  id: number | string;
  name: string;
  // thêm các trường khác nếu cần
}

const Products: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  
  // Parse query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location.search]);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await ProductService.getCategories();
        // Transform data to Category[] if needed
        if (response.data && Array.isArray(response.data)) {
          // Check if response.data contains objects with 'name' property
          if (response.data.length > 0 && typeof response.data[0] === 'object' && response.data[0] !== null) {
            // Data is likely in Category format already, but let's ensure it matches our interface
            const categories = response.data.map((item: any) => ({
              id: item.id || 0,
              name: item.name || (typeof item === 'string' ? item : '')
            }));
            setCategories(categories);
          } else {
            // Data is array of strings or primitive values
            const transformedCategories = response.data.map((cat: any, index) => ({
              id: index + 1,
              name: typeof cat === 'string' ? cat : String(cat)
            }));
            setCategories(transformedCategories);
          }
        } else {
          // Fallback to empty array
          setCategories([]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Sử dụng danh mục mẫu khi API bị lỗi
        setCategories([
          { id: 1, name: 'Electronics' },
          { id: 2, name: 'Clothing' },
          { id: 3, name: 'Home & Kitchen' },
          { id: 4, name: 'Beauty' },
          { id: 5, name: 'Books' },
          { id: 6, name: 'Toys' }
        ]);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch recommended products
  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        const response = await ProductService.getRecommendedProducts();
        setRecommendedProducts(response.data);
      } catch (err) {
        console.error('Error fetching recommended products:', err);
        // Không hiển thị lỗi cho người dùng, sản phẩm đề xuất sẽ được xử lý bởi component khác
      }
    };
    
    fetchRecommendedProducts();
  }, []);
  
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };
  
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Helper function để lấy tên danh mục
  const getCategoryName = (category: Category): string => {
    return category.name || '';
  };
  
  // Helper function để lấy giá trị danh mục
  const getCategoryValue = (category: Category): string => {
    return category.name ? category.name.toLowerCase() : '';
  };
  
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
          Home
        </Link>
        <Typography color="text.primary">Products</Typography>
      </Breadcrumbs>
      
      <Grid container spacing={3}>
        {/* Filters and Search */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 4 }}>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={2}>
              <TextField
                label="Search products"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearchChange}
                sx={{ flexGrow: 1, minWidth: '200px' }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: '150px' }}>
                <InputLabel id="category-select-label">Danh Mục</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  value={selectedCategory}
                  label="Danh Mục"
                  onChange={handleCategoryChange}
                >
                  <MenuItem value="all">Tất Cả Danh Mục</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id || getCategoryName(category)} value={getCategoryValue(category)}>
                      {getCategoryName(category)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: '150px' }}>
                <InputLabel id="sort-select-label">Sắp Xếp Theo</InputLabel>
                <Select
                  labelId="sort-select-label"
                  id="sort-select"
                  value={sortBy}
                  label="Sắp Xếp Theo"
                  onChange={handleSortChange}
                >
                  <MenuItem value="newest">Mới Nhất</MenuItem>
                  <MenuItem value="price_asc">Giá: Thấp đến Cao</MenuItem>
                  <MenuItem value="price_desc">Giá: Cao đến Thấp</MenuItem>
                  <MenuItem value="popular">Phổ Biến Nhất</MenuItem>
                  <MenuItem value="rating">Đánh Giá Cao Nhất</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Grid>
        
        {/* Main Content - Products and Sidebar */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Tất Cả Sản Phẩm
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : (
              <ProductList 
                categoryFilter={selectedCategory}
                searchTerm={searchTerm}
                sortBy={sortBy}
              />
            )}
          </Box>
        </Grid>
        
        {/* Sidebar - Top and Recommended Products */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Sản Phẩm Bán Chạy
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 4, display: { xs: 'none', md: 'block' } }}>
              <TopProducts title="" maxItems={4} />
            </Box>
            
            <Typography variant="h5" gutterBottom>
              Gợi Ý Cho Bạn
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <TopProducts title="" maxItems={4} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Mobile view for Top and Recommended products */}
        <Grid item xs={12} sx={{ display: { md: 'none' } }}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Sản Phẩm Bán Chạy
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TopProducts title="" maxItems={4} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} sx={{ display: { md: 'none' } }}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Gợi Ý Cho Bạn
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TopProducts title="" maxItems={4} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Products; 