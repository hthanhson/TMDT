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
  Autocomplete,
  Alert,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Home as HomeIcon,
  TuneOutlined as TuneIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import ProductList from '../components/Products/ProductList';
import ProductCard from '../components/Products/ProductCard';
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
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 100000000 });
  const [maxPrice, setMaxPrice] = useState(100000000);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Cập nhật tổng số trang mỗi khi tổng sản phẩm hoặc kích thước trang thay đổi
  useEffect(() => {
    setTotalPages(Math.ceil(totalProducts / pageSize));
  }, [totalProducts, pageSize]);

  // Fetch products with current filters
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params: Record<string, string> = {
        page: page.toString(),
        size: pageSize.toString(),
        sort: sortBy
      };
      
      // Se estiver buscando, adicionar termo de busca como "keyword" (parâmetro principal)
      if (searchTerm) {
        // No backend, "keyword" é o parâmetro padrão para busca de texto
        params.keyword = searchTerm;
        
        // Também adicionar como "search" para compatibilidade com alguns endpoints
        params.search = searchTerm;
        
        // Adicionar query como outro possível parâmetro
        params.query = searchTerm;
        
        console.log('Searching for products with term:', searchTerm);
      }
      
      // Se uma categoria específica for selecionada, adicionar à busca
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
        console.log('Filtering by category:', selectedCategory);
      }
      
      if (priceRange.min > 0 || priceRange.max < maxPrice) {
        params.minPrice = priceRange.min.toString();
        params.maxPrice = priceRange.max.toString();
      } else {
        // Ngay cả khi người dùng không chọn khoảng giá,
        // vẫn cần gửi giá trị mặc định để backend hiểu là đang lọc theo giá
        params.minPrice = '0';
        params.maxPrice = maxPrice.toString();
      }
      
      if (selectedRating !== null) {
        params.minRating = selectedRating.toString();
      }
      
      if (inStockOnly) {
        params.inStock = 'true';
      }
      
      console.log('Fetching products with params:', params);
      
      // Usar o método searchProductsSafe que trata erros automaticamente
      const response = await ProductService.searchProductsSafe(params);
      
      // Tratar a resposta da API
      if (response && response.data) {
        let productsData: Product[] = [];
        let total = 0;
        
        // Verificar o tipo da resposta
        if (typeof response.data === 'object' && !Array.isArray(response.data) && response.data !== null) {
          // Verificar se é uma resposta paginada (tem propriedade content)
          if ('content' in response.data && Array.isArray(response.data.content)) {
            // É uma resposta paginada
            productsData = response.data.content;
            
            // Lấy thông tin phân trang từ API cho phân trang,
            // Không qua trình filter sau ở frontend
            total = 'totalElements' in response.data && typeof response.data.totalElements === 'number' 
              ? response.data.totalElements 
              : response.data.content.length;
              
            // Lấy thông tin phân trang từ API
            if ('totalPages' in response.data && typeof response.data.totalPages === 'number') {
              setTotalPages(response.data.totalPages);
            } else {
              setTotalPages(Math.ceil(total / pageSize));
            }
          } else {
            // Objeto desconhecido - tentar extrair informações úteis
            console.warn('Unexpected response format, trying to extract products:', response.data);
            if (Object.values(response.data).some(Array.isArray)) {
              // Tentar encontrar um array no objeto
              for (const key in response.data) {
                if (Array.isArray(response.data[key])) {
                  productsData = response.data[key];
                  total = productsData.length;
                  break;
                }
              }
            } else {
              productsData = [];
              total = 0;
            }
          }
        } else if (Array.isArray(response.data)) {
          // É um array direto de produtos
          productsData = response.data;
          total = response.data.length;
        } else {
          // Tipo desconhecido - fallback para array vazio
          console.warn('Unexpected response type:', typeof response.data);
          productsData = [];
          total = 0;
        }
        
        // Normalizar dados de produtos para garantir consistência
        productsData = productsData.map(product => {
          // Criar uma cópia do produto para não modificar o original
          const normalizedProduct = { ...product };
          
          // Garantir que category seja sempre uma string
          if (normalizedProduct.category === null || normalizedProduct.category === undefined) {
            normalizedProduct.category = '';
          } else if (typeof normalizedProduct.category === 'object' && normalizedProduct.category !== null) {
            // Se category for um objeto, tentar extrair o nome
            const categoryObj = normalizedProduct.category as Record<string, any>;
            if (categoryObj && 'name' in categoryObj && typeof categoryObj.name === 'string') {
              normalizedProduct.categoryName = categoryObj.name;
              normalizedProduct.category = categoryObj.name;
            }
            if (categoryObj && 'id' in categoryObj) {
              normalizedProduct.categoryId = categoryObj.id;
            }
          } else if (typeof normalizedProduct.category !== 'string') {
            // Converter para string se não for
            normalizedProduct.category = String(normalizedProduct.category);
          }
          
          return normalizedProduct;
        });
        
        console.log('Normalized products data sample:', productsData.slice(0, 2));
        
        // Aplicar filtros adicionais no frontend para garantir que apenas produtos relevantes sejam exibidos
        let filteredProducts = productsData;
        
        // Se houver termo de busca, filtrar produtos que correspondam ao termo
        if (searchTerm && searchTerm.trim() !== '') {
          const searchLower = searchTerm.toLowerCase();
          filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchLower) || 
            (product.description && product.description.toLowerCase().includes(searchLower)) ||
            (product.category && product.category.toLowerCase().includes(searchLower))
          );
          console.log(`Frontend filter by search term: ${filteredProducts.length} products match "${searchTerm}"`);
        }
        
        // Se houver categoria selecionada, filtrar produtos dessa categoria
        if (selectedCategory && selectedCategory !== 'all') {
          const categoryLower = selectedCategory.toLowerCase();
          filteredProducts = filteredProducts.filter(product => {
            // Verificar se category é uma string antes de chamar toLowerCase()
            if (product.category && typeof product.category === 'string' && product.category.toLowerCase() === categoryLower) {
              return true;
            }
            
            // Verificar campos adicionais que podem conter informações de categoria
            if (product.categoryId && String(product.categoryId).toLowerCase() === categoryLower) {
              return true;
            }
            
            if (product.categoryName && product.categoryName.toLowerCase() === categoryLower) {
              return true;
            }
            
            // Se chegarmos aqui é porque a categoria não corresponde
            return false;
          });
          console.log(`Frontend filter by category: ${filteredProducts.length} products in "${selectedCategory}"`);
          // Log para debug - ver o formato da categoria
          if (filteredProducts.length === 0 && productsData.length > 0) {
            console.log('Category format debug:', 
              productsData.slice(0, 3).map(p => ({
                id: p.id,
                name: p.name, 
                category: p.category, 
                categoryType: typeof p.category,
                categoryId: p.categoryId,
                categoryName: p.categoryName
              }))
            );
          }
        }
        
        // Definir produtos filtrados e total
        setProducts(filteredProducts);
        
        // Nobuf có phân trang từ API, dùng giá trị cũ cho totalProducts
        // như vậy hiển thị số lượng sản phẩm hiện tại
        console.log(`Setting totalProducts to ${total} (API total) instead of ${filteredProducts.length} (filtered count)`);
        setTotalProducts(total);
      } else {
        // Resposta vazia
        setProducts([]);
        setTotalProducts(0);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Không thể tải sản phẩm. Vui lòng thử lại sau.');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, selectedCategory, sortBy, priceRange, selectedRating, inStockOnly, maxPrice]);

  // Parse query params and trigger search when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      addActiveFilter(`Danh mục: ${categoryParam}`);
    } else {
      setSelectedCategory('all');
    }
    
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
      addActiveFilter(`Tìm kiếm: ${searchParam}`);
    } else {
      setSearchTerm('');
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
    } else {
      setSelectedRating(null);
    }
    
    const inStock = params.get('inStock');
    if (inStock === 'true') {
      setInStockOnly(true);
      addActiveFilter('Chỉ sản phẩm còn hàng');
    } else {
      setInStockOnly(false);
    }
    
    const sort = params.get('sort');
    if (sort) {
      setSortBy(sort);
      addActiveFilter(`Sắp xếp: ${getSortLabel(sort)}`);
    } else {
      setSortBy('newest');
    }
    
    // Reset page when filters change
    setPage(0);
    
    // Sau khi đã parse tất cả parameters, gọi fetchProducts để lấy dữ liệu
  }, [location.search]);

  // Trigger product search whenever filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
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
        // Usar categorias de exemplo em caso de erro
        setCategories([
          { id: 1, name: 'Điện thoại' },
          { id: 2, name: 'Laptop' },
          { id: 3, name: 'Tablet' },
          { id: 4, name: 'Phụ kiện' },
          { id: 5, name: 'Đồng hồ thông minh' },
          { id: 6, name: 'Tai nghe' }
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
        // Usar valor padrão em caso de erro
        setMaxPrice(100000000);
        setPriceRange({ min: 0, max: 100000000 });
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
  
  // Fetch search suggestions - sử dụng debounce để giảm số lượng yêu cầu
  const fetchSuggestionsImpl = async (term: string) => {
    if (term.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const response = await ProductService.getSearchSuggestions(term);
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Trích xuất tên để hiển thị
          const suggestions = response.data.map((item: any) => 
            typeof item === 'string' ? item : item.name || ''
          );
          setSearchSuggestions(suggestions);
        } else if (response.data.content && Array.isArray(response.data.content)) {
          // Phản hồi phân trang - sử dụng nội dung
          const suggestions = response.data.content.map((item: any) =>
            typeof item === 'string' ? item : item.name || ''
          );
          setSearchSuggestions(suggestions);
        } else {
          // Định dạng không xác định - đặt lại gợi ý
          setSearchSuggestions([]);
        }
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
    }
  };

  // Sử dụng hook debounce tùy chỉnh
  const fetchSearchSuggestions = useDebounce(fetchSuggestionsImpl, 500);
  
  // Xử lý thay đổi đầu vào tìm kiếm
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
  
  // Hàm trợ giúp để lấy tên danh mục
  const getCategoryName = (category: Category): string => {
    return category.name || '';
  };
  
  // Hàm trợ giúp để lấy giá trị danh mục
  const getCategoryValue = (category: Category): string => {
    return category.name ? category.name.toLowerCase() : '';
  };
  
  // Hàm trợ giúp để lấy nhãn của tùy chọn sắp xếp
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
  
  // Hàm quản lý bộ lọc đang hoạt động
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
    
    // Xóa bộ lọc khỏi bộ lọc đang hoạt động
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
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleApplyFilters();
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1); // MUI Pagination bắt đầu từ 1, nhưng API bắt đầu từ 0
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn lên đầu trang khi chuyển trang
  };

  const handleApplyFilters = () => {
    // Reset page to first page when applying new filters
    setPage(0);
    
    // Tạo URL mới với các tham số lọc
    const searchParams = new URLSearchParams();
    
    if (selectedCategory !== 'all') {
      searchParams.append('category', selectedCategory);
    }
    
    if (searchTerm) {
      searchParams.append('search', searchTerm);
      searchParams.append('keyword', searchTerm);
    }
    
    if (priceRange.min > 0 || priceRange.max < maxPrice) {
      searchParams.append('minPrice', priceRange.min.toString());
      searchParams.append('maxPrice', priceRange.max.toString());
    } else {
      // Ngay cả khi người dùng không chọn khoảng giá,
      // vẫn cần gửi giá trị mặc định để backend hiểu là đang lọc theo giá
      searchParams.append('minPrice', '0');
      searchParams.append('maxPrice', maxPrice.toString());
    }
    
    if (selectedRating !== null) {
      // Thay đổi 'rating' thành 'minRating' cho phù hợp với backend và fetchProducts
      searchParams.append('minRating', selectedRating.toString());
    }
    
    if (inStockOnly) {
      searchParams.append('inStock', 'true');
    }
    
    if (sortBy !== 'newest') {
      searchParams.append('sort', sortBy);
    }
    
    // Log các bộ lọc được áp dụng
    console.log('Applying filters:', {
      category: selectedCategory,
      search: searchTerm,
      priceRange,
      minRating: selectedRating, // Thay đổi tên tham số trong log
      inStock: inStockOnly,
      sort: sortBy
    });
    
    // Cập nhật URL
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Trigger a fetch with the new filters
    fetchProducts();
    
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
              <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1, minWidth: '200px' }}>
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
                            <IconButton edge="end" type="submit">
                              <SearchIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </form>
              
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
              Tất Cả Sản Phẩm {totalProducts > 0 && `(${totalProducts})`}
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
            ) : products.length === 0 ? (
              <Alert severity="info" sx={{ my: 2 }}>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</Alert>
            ) : (
              <>
                {/* Hiển thị sản phẩm dạng lưới */}
                <Grid container spacing={3}>
                  {products.map((product) => (
                    <Grid item xs={12} sm={6} md={4} key={product.id}>
                      <ProductCard product={product} />
                    </Grid>
                  ))}
                </Grid>
                
                {/* Phân trang */}
                {totalPages > 0 && (
                  <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination 
                      count={totalPages}
                      page={page + 1} // MUI Pagination bắt đầu từ 1
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton 
                      showLastButton
                      size="large"
                    />
                  </Box>
                )}
              </>
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
              <TopProducts title="" maxItems={4} useMonthlyStats={true} />
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
            <TopProducts title="" maxItems={4} useMonthlyStats={true} />
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