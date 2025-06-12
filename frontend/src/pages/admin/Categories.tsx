import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import AdminService from '../../services/AdminService';
import { API_URL } from '../../config';

interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isActive: true,
    imageUrl: '',
    displayOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log('Fetching all categories including inactive ones...');
      
      // Use the dedicated method for fetching ALL categories for admin
      const response = await AdminService.getAllCategoriesAdmin();
      
      console.log('Categories API response:', response);
      
      // Xử lý dữ liệu phản hồi
      let categoriesData: Category[] = [];
      
      // Process the response data carefully preserving original IDs
      if (response && response.data) {
        const responseData = response.data as any;
        
        const dataToProcess = Array.isArray(responseData) 
          ? responseData 
          : (responseData.content && Array.isArray(responseData.content)) 
            ? responseData.content 
            : [];
        
        console.log('Data to process:', dataToProcess);
        
        categoriesData = dataToProcess.map((cat: any) => {
          if (typeof cat === 'string') {
            return { 
              id: cat, 
              name: cat, 
              description: '', 
              createdAt: '', 
              updatedAt: '',
              isActive: true 
            };
          }
          
          // Preserve the original ID from the database
          // Be careful not to convert ID types in a way that would change their value
          return {
            id: cat.id?.toString() || '',
            name: cat.name?.toString() || '',
            description: cat.description?.toString() || '',
            imageUrl: cat.imageUrl?.toString() || '',
            isActive: cat.isActive === undefined ? true : Boolean(cat.isActive), // Convert to boolean properly
            displayOrder: Number(cat.displayOrder) || 0,
            createdAt: cat.createdAt?.toString() || '',
            updatedAt: cat.updatedAt?.toString() || ''
          };
        });
      }
      
      console.log('Final processed categories:', categoriesData);
      
      setCategories(categoriesData);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category: Category | null = null) => {
    setCurrentCategory(category);
    if (category) {
      setCategoryForm({
        name: category.name,
        description: category.description,
        isActive: category.isActive !== false,
        imageUrl: category.imageUrl || '',
        displayOrder: category.displayOrder || 0,
      });
    } else {
      setCategoryForm({
        name: '',
        description: '',
        isActive: true,
        imageUrl: '',
        displayOrder: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCategory(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    try {
      setFormError(null);
      setSaving(true);
      
      console.log('Saving category with data:', categoryForm);
      
      if (currentCategory) {
        // Ensure we use the exact ID from the database when updating
        const categoryId = currentCategory.id;
        console.log(`Updating category with ID=${categoryId}, isActive=${categoryForm.isActive}`);
        
        // Create a clean update object that includes all necessary fields
        const updateData = {
          name: categoryForm.name,
          description: categoryForm.description,
          isActive: categoryForm.isActive,
          imageUrl: categoryForm.imageUrl,
          displayOrder: categoryForm.displayOrder
        };
        
        await AdminService.updateCategory(String(categoryId), updateData);
      } else {
        console.log('Creating new category with isActive=true');
        await AdminService.createCategory(categoryForm);
      }
      
      handleCloseDialog();
      fetchCategories();
    } catch (err: any) {
      console.error('Error saving category:', err);
      setFormError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string | number) => {
    try {
      // First check if the category has associated products
      const checkResult = await AdminService.checkCategoryHasProducts(String(id));
      
      if (checkResult.hasProducts) {
        // Show error message if the category has products
        const errorMsg = `Không thể xóa danh mục. danh mục hiện có ${checkResult.productCount} mặt hàng. Vui lòng xóa mặt hàng trước nếu muốn tiếp tục.`;
        setError(errorMsg);
        
        // Also show a snackbar notification
        setSnackbarMessage(errorMsg);
        setSnackbarOpen(true);
        return;
      }
      
      // If no products, proceed with confirmation and deletion
      if (window.confirm('Are you sure you want to delete this category?')) {
        try {
          await AdminService.deleteCategory(String(id));
          setError(null); // Clear any previous errors
          fetchCategories();
        } catch (err: any) {
          console.error('Error deleting category:', err);
          const errorMessage = err.response?.data?.message || 'Failed to delete category';
          setError(errorMessage);
          
          // Show snackbar for API errors too
          setSnackbarMessage(errorMessage);
          setSnackbarOpen(true);
        }
      }
    } catch (err: any) {
      console.error('Error checking if category has products:', err);
      const errorMessage = 'Unable to check if category has products. Please try again.';
      setError(errorMessage);
      
      // Show snackbar
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Quản lý danh mục</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Category
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}


      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tên</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{String(category.id)}</TableCell>
                  <TableCell>{String(category.name)}</TableCell>
                  <TableCell>{String(category.description)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: category.isActive ? 'success.light' : 'error.light',
                        color: 'white',
                        fontSize: '0.875rem',
                      }}
                    >
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(category)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteCategory(category.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No categories found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentCategory ? 'Chỉnh sửa danh mục' : 'Thêm Danh Mục Mới'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Tên Danh mục"
            type="text"
            fullWidth
            variant="outlined"
            value={categoryForm.name}
            onChange={handleInputChange}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Mô tả"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={categoryForm.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={categoryForm.isActive}
                onChange={handleInputChange}
                name="isActive"
                color="primary"
              />
            }
            label="Active"
          />
          {formError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCategory}
            variant="contained"
            color="primary"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminCategories; 