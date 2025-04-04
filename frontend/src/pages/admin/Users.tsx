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
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  IconButton,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import AdminService from '../../services/AdminService';
import { toast } from 'react-toastify';

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    address: '',
    phoneNumber: '',
    roles: [] as string[],
    enabled: false,
  });
  const [coupons, setCoupons] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchActiveCoupons();
  }, []);

  const fetchActiveCoupons = async () => {
    try {
      const response = await AdminService.getActiveCoupons();
      console.log('Coupons API response:', response);
      setCoupons(response.data || []);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setCoupons([]);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAllUsers();
      console.log('User API response:', response);
      
      if (response && response.data) {
        if (response.data.content) {
          // Dữ liệu trả về theo dạng phân trang
          console.log('Setting users from paginated data:', response.data.content);
          setUsers(response.data.content);
        } else if (Array.isArray(response.data)) {
          // Dữ liệu trả về trực tiếp là mảng
          console.log('Setting users from array data:', response.data);
          setUsers(response.data);
        } else {
          console.error('Unexpected data format:', response.data);
          setUsers([]);
        }
      } else {
        console.error('Invalid response format:', response);
        setUsers([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user: any) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      address: user.address || '',
      phoneNumber: user.phoneNumber || '',
      roles: user.roles || [],
      enabled: user.enabled || false,
    });
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

  const handleRolesChange = (e: any) => {
    setFormData({
      ...formData,
      roles: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await AdminService.updateUser(currentUser.id, formData);
      fetchUsers();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const handleToggleUserStatus = async (userId: string, enabled: boolean) => {
    const action = enabled ? 'unlock' : 'lock';
    if (window.confirm(`Are you sure you want to ${action} this user account?`)) {
      try {
        await AdminService.updateUserStatus(userId, enabled);
        fetchUsers();
        setError(null);
      } catch (err: any) {
        console.error('Error updating user status:', err);
        setError(err.response?.data?.message || `Failed to ${action} user account`);
      }
    }
  };

  const handleDeleteUser = async (userId: string, roles: string[]) => {
    if (roles.includes('ROLE_ADMIN')) {
      setError('Admin users cannot be deleted');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await AdminService.deleteUser(userId);
        fetchUsers();
        setError(null);
      } catch (err: any) {
        console.error('Error deleting user:', err);
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleAssignCoupon = async (userId: string, couponCode: string) => {
    try {
      await AdminService.assignCouponToUser(userId, couponCode);
      toast.success('Đã tặng mã giảm giá thành công');
      fetchUsers();
    } catch (err: any) {
      console.error('Lỗi khi tặng mã:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi tặng mã giảm giá');
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Actions</TableCell>
              <TableCell>Tặng mã</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(users) && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.fullName || '-'}</TableCell>
                  <TableCell>
                    {Array.isArray(user.roles) && user.roles.map((role: any) => {
                      const roleStr = typeof role === 'string' ? role : String(role);
                      return (
                        <Chip
                          key={roleStr}
                          label={roleStr.replace('ROLE_', '')}
                          color={roleStr.includes('ADMIN') ? 'primary' : 'default'}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      );
                    })}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(user)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteUser(user.id, user.roles)}
                      color="error"
                      disabled={Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN')}
                      title={user.roles.includes('ROLE_ADMIN') ? 'Admin users cannot be deleted' : 'Delete user'}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleToggleUserStatus(user.id, !user.enabled)}
                      color={user.enabled ? "error" : "success"}
                      disabled={Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN')}
                    >
                      {user.enabled ? <BlockIcon /> : <CheckCircleIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Mã giảm giá</InputLabel>
                      <Select
                        value={''}
                        label="Mã giảm giá"
                        onChange={(e) => handleAssignCoupon(user.id, e.target.value as string)}
                      >
                        {coupons.map((coupon) => (
                          <MenuItem key={coupon.code} value={coupon.code}>
                            {coupon.code} ({coupon.discount}% giảm)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit User: {currentUser?.username}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  InputProps={{ readOnly: true }}
                  disabled
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  InputProps={{ readOnly: true }}
                  disabled
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="roles-label">Roles</InputLabel>
                  <Select
                    labelId="roles-label"
                    multiple
                    value={formData.roles}
                    onChange={handleRolesChange}
                    label="Roles"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value.replace('ROLE_', '')} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="ROLE_USER">User</MenuItem>
                    <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
                    <MenuItem value="ROLE_MODERATOR">Moderator</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;