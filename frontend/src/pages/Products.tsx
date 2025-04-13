import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CircularProgress,
  Slider,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Button,
  Chip,
  Autocomplete
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Home as HomeIcon,
  TuneOutlined as TuneIcon,
  Clear as ClearIcon
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

// Định nghĩa interfaces cho tính năng lọc
interface PriceRange {
  min: number;
  max: number;
}

interface ProductFilters {
  category: string;
  priceRange: PriceRange;
  rating: number | null;
  inStock: boolean;
  sortBy: string;
  searchTerm: string;
}

// Custom debounce hook
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timer = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );
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
  
  // State cho tìm kiếm nâng cao
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 10000000 });
  const [maxPrice, setMaxPrice] = useState(10000000);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Parse query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      addActiveFilter(`Danh mục: ${categoryParam}`);
    }
    
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      addActiveFilter(`Tìm kiếm: ${searchParam}`);
    }
    
    const minPrice = params.get('minPrice');
    const maxPrice = params.get('maxPrice');
    if (minPrice && maxPrice) {
      setPriceRange({
        min: parseInt(minPrice),
        max: parseInt(maxPrice)
      });
      addActiveFilter(`Giá: ${formatCurrency(parseInt(minPrice))} - ${formatCurrency(parseInt(maxPrice))}`);
    }
    
    const rating = params.get('rating');
    if (rating) {
      setSelectedRating(parseInt(rating));
      addActiveFilter(`Đánh giá: ${rating} sao trở lên`);
    }
    
    const inStock = params.get('inStock');
    if (inStock === 'true') {
      setInStockOnly(true);
      addActiveFilter('Chỉ sản phẩm còn hàng');
    }
  }, [location.search]);
  
  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
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
    
    // Tìm giá sản phẩm cao nhất để thiết lập thanh trượt
    const fetchMaxPrice = async () => {
      try {
        const response = await ProductService.getMaxPrice();
        if (response.data && response.data.maxPrice) {
          setMaxPrice(response.data.maxPrice);
          setPriceRange({ min: 0, max: response.data.maxPrice });
        }
      } catch (err) {
        console.error('Error fetching max price:', err);
        // Giữ nguyên giá mặc định nếu có lỗi
      }
    };
    
    fetchMaxPrice();
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
  
  // Fetch search suggestions - sử dụng debounce để giảm số lượng request
  const fetchSuggestionsImpl = async (term: string) => {
    if (term.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await ProductService.getSearchSuggestions(term);
      if (response.data && Array.isArray(response.data)) {
        // Extract names for display or transform as needed
        const suggestions = response.data.map((item: any) => 
          typeof item === 'string' ? item : item.name || ''
        );
        setSearchSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
    }
  };

  // Use our custom debounce hook
  const fetchSearchSuggestions = useDebounce(fetchSuggestionsImpl, 500);
  
  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    fetchSearchSuggestions(term);
  };
  
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
    addActiveFilter(`Sắp xếp: ${getSortLabel(event.target.value)}`);
  };
  
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
    if (event.target.value === 'all') {
      removeActiveFilter('Danh mục');
    } else {
      addActiveFilter(`Danh mục: ${event.target.value}`);
    }
  };
  
  const handlePriceRangeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setPriceRange({ min: newValue[0], max: newValue[1] });
    }
  };
  
  const handlePriceRangeChangeCommitted = (event: React.SyntheticEvent | Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      addActiveFilter(`Giá: ${formatCurrency(newValue[0])} - ${formatCurrency(newValue[1])}`);
    }
  };
  
  const handleRatingChange = (rating: number | null) => {
    setSelectedRating(rating);
    if (rating === null) {
      removeActiveFilter('Đánh giá');
    } else {
      addActiveFilter(`Đánh giá: ${rating} sao trở lên`);
    }
  };
  
  const handleInStockChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInStockOnly(event.target.checked);
    if (event.target.checked) {
      addActiveFilter('Chỉ sản phẩm còn hàng');
    } else {
      removeActiveFilter('Chỉ sản phẩm còn hàng');
    }
  };
  
  // Helper function để lấy tên danh mục
  const getCategoryName = (category: Category): string => {
    return category.name || '';
  };
  
  // Helper function để lấy giá trị danh mục
  const getCategoryValue = (category: Category): string => {
    return category.name ? category.name.toLowerCase() : '';
  };
  
  // Helper function để lấy label của sort option
  const getSortLabel = (value: string): string => {
    switch (value) {
      case 'newest':
        return 'Mới Nhất';
      case 'price_asc':
        return 'Giá: Thấp đến Cao';
      case 'price_desc':
        return 'Giá: Cao đến Thấp';
      case 'popular':
        return 'Phổ Biến Nhất';
      case 'rating':
        return 'Đánh Giá Cao Nhất';
      default:
        return value;
    }
  };
  
  // Function để quản lý active filters
  const addActiveFilter = (filter: string) => {
    const filterType = filter.split(':')[0];
    setActiveFilters(prev => {
      const newFilters = prev.filter(f => !f.startsWith(filterType));
      return [...newFilters, filter];
    });
  };
  
  const removeActiveFilter = (filterPrefix: string) => {
    setActiveFilters(prev => prev.filter(filter => !filter.startsWith(filterPrefix)));
  };
  
  const handleRemoveFilter = (filter: string) => {
    const filterType = filter.split(':')[0];
    
    // Xóa filter khỏi active filters
    removeActiveFilter(filterType);
    
    // Reset giá trị tương ứng
    switch (filterType) {
      case 'Danh mục':
        setSelectedCategory('all');
        break;
      case 'Tìm kiếm':
        setSearchTerm('');
        break;
      case 'Giá':
        setPriceRange({ min: 0, max: maxPrice });
        break;
      case 'Đánh giá':
        setSelectedRating(null);
        break;
      case 'Chỉ sản phẩm còn hàng':
        setInStockOnly(false);
        break;
      case 'Sắp xếp':
        setSortBy('newest');
        break;
    }
  };
  
  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    setPriceRange({ min: 0, max: maxPrice });
    setSelectedRating(null);
    setInStockOnly(false);
    setSortBy('newest');
    setActiveFilters([]);
  };
  
  const handleApplyFilters = () => {
    // Tạo URL mới với các tham số lọc
    const searchParams = new URLSearchParams();
    
    if (selectedCategory !== 'all') {
      searchParams.append('category', selectedCategory);
    }
    
    if (searchTerm) {
      searchParams.append('search', searchTerm);
    }
    
    if (priceRange.min > 0 || priceRange.max < maxPrice) {
      searchParams.append('minPrice', priceRange.min.toString());
      searchParams.append('maxPrice', priceRange.max.toString());
    }
    
    if (selectedRating !== null) {
      searchParams.append('rating', selectedRating.toString());
    }
    
    if (inStockOnly) {
      searchParams.append('inStock', 'true');
    }
    
    if (sortBy !== 'newest') {
      searchParams.append('sort', sortBy);
    }
    
    // Cập nhật URL
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Ẩn bộ lọc nâng cao sau khi áp dụng
    setShowAdvancedFilters(false);
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
          Trang chủ
        </Link>
        <Typography color="text.primary">Sản phẩm</Typography>
      </Breadcrumbs>
      
      <Grid container spacing={3}>
        {/* Filters and Search */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 4 }}>
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={2}>
              <Autocomplete
                freeSolo
                options={searchSuggestions}
                value={searchTerm}
                onChange={(event, newValue) => {
                  setSearchTerm(newValue || '');
                  if (newValue) {
                    addActiveFilter(`Tìm kiếm: ${newValue}`);
                  } else {
                    removeActiveFilter('Tìm kiếm');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tìm kiếm sản phẩm"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    sx={{ flexGrow: 1, minWidth: '200px' }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton edge="end">
                            <SearchIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                sx={{ flexGrow: 1, minWidth: '200px' }}
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
              
              <Tooltip title="Tìm kiếm nâng cao">
                <IconButton 
                  color={showAdvancedFilters ? "primary" : "default"} 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <TuneIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Bộ lọc nâng cao
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Price Range */}
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>
                      Khoảng giá: {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                    </Typography>
                    <Slider
                      value={[priceRange.min, priceRange.max]}
                      onChange={handlePriceRangeChange}
                      onChangeCommitted={handlePriceRangeChangeCommitted}
                      valueLabelDisplay="auto"
                      min={0}
                      max={maxPrice}
                      step={100000}
                      valueLabelFormat={(value) => formatCurrency(value)}
                    />
                  </Grid>
                  
                  {/* Rating */}
                  <Grid item xs={12} md={6}>
                    <Typography gutterBottom>
                      Đánh giá từ
                    </Typography>
                    <Box display="flex" gap={1}>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <Button
                          key={rating}
                          variant={selectedRating === rating ? "contained" : "outlined"}
                          size="small"
                          onClick={() => handleRatingChange(selectedRating === rating ? null : rating)}
                        >
                          {rating}⭐
                        </Button>
                      ))}
                    </Box>
                  </Grid>
                  
                  {/* Stock Status */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={inStockOnly}
                          onChange={handleInStockChange}
                          name="inStock"
                          color="primary"
                        />
                      }
                      label="Chỉ hiển thị sản phẩm còn hàng"
                    />
                  </Grid>
                </Grid>
                
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button variant="outlined" color="inherit" onClick={clearAllFilters} sx={{ mr: 1 }}>
                    Đặt lại
                  </Button>
                  <Button variant="contained" onClick={handleApplyFilters}>
                    Áp dụng
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Bộ lọc đang áp dụng:
                </Typography>
                {activeFilters.map((filter) => (
                  <Chip
                    key={filter}
                    label={filter}
                    onDelete={() => handleRemoveFilter(filter)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {activeFilters.length > 1 && (
                  <Chip
                    label="Xóa tất cả"
                    onDelete={clearAllFilters}
                    size="small"
                    color="error"
                    deleteIcon={<ClearIcon />}
                  />
                )}
              </Box>
            )}
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
                priceRange={priceRange}
                ratingFilter={selectedRating}
                inStockOnly={inStockOnly}
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