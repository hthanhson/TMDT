import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import AdminService from '../../services/AdminService';
import { useTheme } from '@mui/material/styles';
import { getProductImageUrl, FALLBACK_IMAGE } from '../../utils/imageHelpers';
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    imageFile: null as File | null,
  });
  const theme = useTheme();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAllProducts();
      console.log('Products API raw response:', response);
      
      // Đảm bảo console.log hoạt động tốt ngay cả với dữ liệu lớn
      try {
        console.log('Products API response (stringified):', JSON.stringify(response).slice(0, 500) + '...');
      } catch (e) {
        console.log('Failed to stringify response:', e);
      }
      
      // Kiểm tra chi tiết cấu trúc response
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'No response');
      
      // Một số backend có thể trả về response trong định dạng khác
      // Thử tìm hiểu nơi có thể chứa dữ liệu
      let possibleDataContainers = [];
      if (response) {
        possibleDataContainers = [
          response,
          response.data,
          response.body,
          response.content,
          response.items,
          response.products,
          response.result,
          response.results,
        ].filter(Boolean); // Chỉ giữ lại những giá trị không null/undefined
      }
      
      console.log('Possible data containers found:', possibleDataContainers.length);
      
      let productsData = [];
      
      if (response && typeof response === 'object') {
        // Case 1: Dữ liệu trả về trực tiếp trong response (không có data wrapper)
        if (Array.isArray(response)) {
          console.log('Response is directly an array');
          productsData = response;
        } 
        // Case 2: Dữ liệu được đóng gói trong response.data
        else if (response.data) {
          console.log('Response has data property, type:', typeof response.data);
          
          // Case 2.1: response.data là một mảng
          if (Array.isArray(response.data)) {
            console.log('Data is an array with length:', response.data.length);
            productsData = response.data;
          } 
          // Case 2.2: response.data là một object có thuộc tính content (dạng phân trang)
          else if (response.data.content && Array.isArray(response.data.content)) {
            console.log('Data is paginated, content length:', response.data.content.length);
            productsData = response.data.content;
          } 
          // Case 2.3: response.data là một object đơn lẻ (một sản phẩm)
          else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            console.log('Data is a single object');
            productsData = [response.data];
          }
        }
        // Case 3: Response có thuộc tính content trực tiếp (phân trang không qua data)
        else if (response.content && Array.isArray(response.content)) {
          console.log('Response has content array directly, length:', response.content.length);
          productsData = response.content;
        }
        // Case 4: Response là object sản phẩm đơn lẻ
        else if (response.id) {
          console.log('Response appears to be a single product');
          productsData = [response];
        }
      }
      
      console.log('Extracted products data:', productsData);
      console.log('Products data length:', productsData.length);
      
      if (productsData.length > 0) {
        // Chuẩn hóa dữ liệu để đảm bảo các trường cần thiết đều có giá trị
        const normalizedProducts = productsData.map((product: any) => {
          console.log('Processing product:', product);
          
          // Xử lý category có thể ở nhiều dạng khác nhau
          let categoryValue = '';
          if (product.category) {
            if (typeof product.category === 'object' && product.category !== null) {
              categoryValue = product.category.name || product.category.title || JSON.stringify(product.category);
            } else if (typeof product.category === 'string') {
              categoryValue = product.category;
            } else {
              categoryValue = String(product.category);
            }
          }
          
          return {
            id: product.id || '',
            name: product.name || '',
            description: product.description || '',
            price: typeof product.price === 'number' ? product.price : 
                   typeof product.price === 'string' ? parseFloat(product.price) || 0 : 0,
            category: categoryValue,
            categoryObject: product.category, // Lưu lại object gốc để sử dụng nếu cần
            stock: typeof product.stock === 'number' ? product.stock : 
                   typeof product.stock === 'string' ? parseInt(product.stock) || 0 : 0,
            imageUrl: product.imageUrl || product.image || '',
            rating: product.rating || 0,
            createdAt: product.createdAt || '',
            updatedAt: product.updatedAt || ''
          };
        });
        
        console.log('Normalized products:', normalizedProducts);
        setProducts(normalizedProducts);
        setError(null);
      } else {
        console.error('No products data found in response', response);
        setProducts([]);
        if (response && response.data) {
          setError('No products data found. Server returned data in an unexpected format.');
        } else if (response) {
          setError('No products data found. Server response is empty or invalid.');
        } else {
          setError('No response received from server.');
        }
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      if (err.response) {
        console.error('Error response:', err.response);
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
      }
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product: Product | any = null) => {
    if (product) {
      setCurrentProduct(product);
      
      // Xử lý category cẩn thận
      let categoryValue = '';
      if (product.category) {
        if (typeof product.category === 'object' && product.category !== null) {
          categoryValue = product.category.name || product.category.title || '';
        } else {
          categoryValue = String(product.category);
        }
      }
      
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: typeof product.price === 'number' 
          ? product.price.toString() 
          : typeof product.price === 'string' 
            ? product.price 
            : '0',
        category: categoryValue,
        stock: typeof product.stock === 'number' 
          ? product.stock.toString() 
          : typeof product.stock === 'string' 
            ? product.stock 
            : '0',
        imageFile: null,
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        imageFile: null,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        imageFile: e.target.files[0],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Product name is required');
        return;
      }
      
      if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
        setError('Valid price is required');
        return;
      }
      
      const productData = new FormData();
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('price', formData.price);
      productData.append('category', formData.category);
      productData.append('stock', formData.stock);
      
      if (formData.imageFile) {
        productData.append('image', formData.imageFile);
      }
      
      console.log('Submitting product form data:', {
        id: currentProduct?.id,
        name: formData.name,
        description: formData.description.substring(0, 20) + '...',
        price: formData.price,
        category: formData.category,
        stock: formData.stock,
        hasImage: !!formData.imageFile
      });
      
      let response;
      if (currentProduct) {
        // Update existing product
        console.log(`Updating product ID: ${currentProduct.id}`);
        response = await AdminService.updateProduct(currentProduct.id, productData);
        console.log('Update response:', response);
      } else {
        // Create new product
        console.log('Creating new product');
        response = await AdminService.createProduct(productData);
        console.log('Create response:', response);
      }
      
      fetchProducts();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving product:', err);
      if (err.response) {
        console.error('Error response status:', err.response.status);
        console.error('Error response data:', err.response.data);
      }
      
      const errorMessage = err.response?.data?.message || 
                          (currentProduct ? 'Failed to update product' : 'Failed to create product');
      setError(errorMessage);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await AdminService.deleteProduct(productId);
        fetchProducts();
      } catch (err: any) {
        console.error('Error deleting product:', err);
        setError(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  if (loading && products.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Quản lý sản phẩm</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            bgcolor: theme.palette.success.main,
            '&:hover': {
              bgcolor: theme.palette.success.dark,
            },
            px: 3,
            py: 1
          }}
        >
          Thêm sản phẩm
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => fetchProducts()}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Debug information - hidden in production */}
      {process.env.NODE_ENV !== 'production' && error && (
        <Paper sx={{ p: 2, mb: 2, maxHeight: 200, overflow: 'auto' }}>
          <Typography variant="subtitle2" color="error">Debug information</Typography>
          <pre style={{ fontSize: '0.75rem' }}>
            {JSON.stringify({ products, error }, null, 2)}
          </pre>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ảnh</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell>Giá</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell>Số lượng</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(products) && products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id || Math.random().toString()}>
                  <TableCell>
                    <Box
                      component="img"
                      src={getProductImageUrl(product.id)}
                      onError={(e: any) => (e.currentTarget.src = FALLBACK_IMAGE)}
                      sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell>{product.name || 'Unnamed product'}</TableCell>
                  <TableCell>
                    {typeof product.price === 'number' 
                      ? `${product.price.toFixed(2)} VND` 
                      : typeof product.price === 'string' 
                        ? `${parseFloat(product.price).toFixed(2)} VND` 
                        : '$0.00 VND'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={
                        typeof product.category === 'object' && product.category !== null
                          ? product.category.name || product.category.title || 'Uncategorized'
                          : product.category || 'Uncategorized'
                      } 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {typeof product.stock === 'number' && product.stock > 0 ? (
                      product.stock
                    ) : typeof product.stock === 'string' && parseInt(product.stock) > 0 ? (
                      parseInt(product.stock)
                    ) : (
                      <Chip label="Out of stock" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDeleteProduct(product.id)} 
                      color="error" 
                      disabled={!product.id}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên sản phẩm "
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Danh mục"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá"
                  name="price"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Số lượng"
                  name="stock"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  multiline
                  rows={4}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" component="label">
                  Upload Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>
                {formData.imageFile ? (
                  <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                    {formData.imageFile.name}
                  </Typography>
                ) : currentProduct?.imageUrl ? (
                  <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                    Ảnh sẽ được giữ lại
                  </Typography>
                ) : null}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {currentProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminProducts;