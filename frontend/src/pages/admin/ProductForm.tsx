import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  FormHelperText,
  IconButton,
  Avatar,
  CircularProgress,
  Container,
  Breadcrumbs,
  Link,
  SelectChangeEvent
} from '@mui/material';
import { 
  PhotoCamera, 
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import AdminService from '../../services/AdminService';
import { Category } from '../../types';

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  stock: string;
  imageFile: File | null;
  imageUrl?: string;
}

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '0',
    imageFile: null
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await AdminService.getAllCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };

    fetchCategories();

    if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await AdminService.getProduct(productId);
          const product = response.data;
          
          setFormData({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            categoryId: product.category?.id?.toString() || '',
            stock: product.stock.toString(),
            imageFile: null,
            imageUrl: product.imageUrl
          });
          
          setImagePreview(product.imageUrl);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching product:', err);
          setError('Failed to load product');
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [productId]);

  const validateForm = (): boolean => {
    let valid = true;
    const errors = {
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image: ''
    };

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      valid = false;
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      valid = false;
    }

    if (!formData.price.trim()) {
      errors.price = 'Price is required';
      valid = false;
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = 'Price must be a positive number';
      valid = false;
    }

    if (!formData.categoryId) {
      errors.category = 'Category is required';
      valid = false;
    }

    if (!formData.stock.trim()) {
      errors.stock = 'Stock is required';
      valid = false;
    } else if (isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      errors.stock = 'Stock must be a non-negative number';
      valid = false;
    }

    if (!productId && !formData.imageFile && !formData.imageUrl) {
      errors.image = 'Image is required';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent
  ) => {
    const { name = '', value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        imageFile: file
      });

      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setFormData({
      ...formData,
      imageFile: null
    });
    
    if (!formData.imageUrl) {
      setImagePreview(null);
    } else {
      setImagePreview(formData.imageUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const productData = new FormData();
      productData.append('name', formData.name);
      productData.append('description', formData.description);
      productData.append('price', formData.price);
      productData.append('categoryId', formData.categoryId);
      productData.append('stock', formData.stock);
      
      if (formData.imageFile) {
        productData.append('imageFile', formData.imageFile);
      }
      
      if (productId) {
        await AdminService.updateProduct(productId, productData);
      } else {
        await AdminService.createProduct(productData);
      }
      
      navigate('/admin/products');
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/products');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 4 }}>
        <Link
          underline="hover"
          color="inherit"
          href="/admin/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          href="/admin/products"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          Products
        </Link>
        <Typography color="text.primary">
          {productId ? 'Edit Product' : 'Add Product'}
        </Typography>
      </Breadcrumbs>
      
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">
          {productId ? 'Edit Product' : 'Add New Product'}
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        {error && (
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.category}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  label="Category"
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.category && (
                  <FormHelperText>{formErrors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                value={formData.price}
                onChange={handleInputChange}
                error={!!formErrors.price}
                helperText={formErrors.price}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock"
                name="stock"
                type="number"
                inputProps={{ min: 0 }}
                value={formData.stock}
                onChange={handleInputChange}
                error={!!formErrors.stock}
                helperText={formErrors.stock}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Product Image
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                {imagePreview ? (
                  <Box position="relative">
                    <Avatar
                      src={imagePreview}
                      alt="Product"
                      variant="rounded"
                      sx={{ width: 100, height: 100 }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        bgcolor: 'background.paper',
                      }}
                      onClick={handleClearImage}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Avatar
                    variant="rounded"
                    sx={{ width: 100, height: 100 }}
                  >
                    No Image
                  </Avatar>
                )}
                
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<PhotoCamera />}
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </Box>
              {formErrors.image && (
                <Typography color="error" variant="caption">
                  {formErrors.image}
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                <Button 
                  variant="outlined" 
                  onClick={handleCancel}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    productId ? 'Update Product' : 'Add Product'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProductForm; 