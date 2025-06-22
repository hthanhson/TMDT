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

interface Role {
  id: number;
  name: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: Role[] | string[];
  enabled: boolean;
  createdAt: string;
  fullName: string;
  address: string;
  phoneNumber: string;
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  // Hàm để chuẩn hóa danh sách vai trò từ nhiều định dạng khác nhau
  const normalizeRoles = (roleData: any): string[] => {
    if (!roleData) return [];
    
    // Trường hợp 1: Mảng các đối tượng Role { id, name }
    if (Array.isArray(roleData) && roleData.length > 0 && typeof roleData[0] === 'object' && roleData[0].name) {
      return roleData.map(role => role.name);
    }
    
    // Trường hợp 2: Mảng các chuỗi
    if (Array.isArray(roleData) && roleData.length > 0 && typeof roleData[0] === 'string') {
      return roleData;
    }
    
    // Mặc định trả về mảng rỗng
    return [];
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAllUsers();
      console.log('Raw user API response:', response);
      
      // Xử lý dữ liệu người dùng từ nhiều định dạng khác nhau
      let processedUsers: User[] = [];
      
      if (response && response.data) {
        // Trường hợp 1: Dữ liệu phân trang
        if (response.data.content && Array.isArray(response.data.content)) {
          processedUsers = response.data.content;
        } 
        // Trường hợp 2: Mảng trực tiếp
        else if (Array.isArray(response.data)) {
          processedUsers = response.data;
        }
        
        // Chuẩn hóa dữ liệu người dùng
        const normalizedUsers = processedUsers.map(user => {
          // Chuẩn hóa vai trò của người dùng
          const normalizedRoles = normalizeRoles(user.roles);
          
          return {
            ...user,
            // Đảm bảo mọi trường đều có giá trị
            id: user.id?.toString() || '',
            username: user.username || '',
            email: user.email || '',
            fullName: user.fullName || '',
            address: user.address || '',
            phoneNumber: user.phoneNumber || '',
            enabled: user.enabled !== undefined ? user.enabled : true,
            roles: normalizedRoles,
            // Lưu trữ dữ liệu vai trò gốc để sử dụng khi cần thiết
            _originalRoles: user.roles
          };
        });
        
        console.log('Normalized users:', normalizedUsers);
        setUsers(normalizedUsers);
      } else {
        console.warn('No data in response:', response);
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

  const handleOpenDialog = (user: User) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName || '',
      address: user.address || '',
      phoneNumber: user.phoneNumber || '',
      roles: normalizeRoles(user.roles),
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
    
    if (!currentUser) return;
    
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

  const handleDeleteUser = async (userId: string, roles: any[]) => {
    // Kiểm tra nếu người dùng là admin
    const isAdmin = Array.isArray(roles) && roles.some(role => 
      (typeof role === 'string' && role.includes('ADMIN')) || 
      (typeof role === 'object' && role.name && role.name.includes('ADMIN'))
    );
    
    if (isAdmin) {
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

  // Hàm để lấy tên vai trò hiển thị
  const getRoleDisplayName = (role: any): string => {
    if (typeof role === 'string') {
      return role.replace('ROLE_', '');
    }
    
    if (typeof role === 'object' && role.name) {
      return role.name.replace('ROLE_', '');
    }
    
    return String(role).replace('ROLE_', '');
  };
  
  // Hàm để kiểm tra xem người dùng có vai trò admin không
  const hasAdminRole = (roles: any[]): boolean => {
    if (!Array.isArray(roles)) return false;
    
    return roles.some(role => 
      (typeof role === 'string' && role.includes('ADMIN')) ||
      (typeof role === 'object' && role.name && role.name.includes('ADMIN'))
    );
  };
  const hasShiperRole = (roles: any[]): boolean => {
    if (!Array.isArray(roles)) return false;
    
    return roles.some(role => 
      (typeof role === 'string' && role.includes('SHIPPER')) ||
      (typeof role === 'object' && role.name && role.name.includes('SHIPPER'))
    );
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
       Quản lý người dùng
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
                    {Array.isArray(user.roles) && user.roles.map((role: any, index) => (
                      <Chip
                        key={index}
                        label={getRoleDisplayName(role)}
                        color={
                          (typeof role === 'string' && role.includes('ADMIN')) || 
                          (typeof role === 'object' && role.name && role.name.includes('ADMIN')) 
                            ? 'primary' 
                            : 'default'
                        }
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </TableCell>
                  <TableCell>
                    {/* <IconButton onClick={() => handleOpenDialog(user)}>
                      <EditIcon />
                    </IconButton> */}
                    <IconButton
                      onClick={() => handleDeleteUser(user.id, user.roles)}
                      color="error"
                      disabled={hasAdminRole(user.roles)}
                      title={hasAdminRole(user.roles) ? 'Admin users cannot be deleted' : 'Delete user'}
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleToggleUserStatus(user.id, !user.enabled)}
                      color={user.enabled ? "error" : "success"}
                      disabled={hasAdminRole(user.roles)}
                    >
                      {user.enabled ? <BlockIcon /> : <CheckCircleIcon />}
                    </IconButton>
                  </TableCell>
                  {!(hasShiperRole(user.roles) || hasAdminRole(user.roles)) && (
                  <TableCell >
                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={hasShiperRole(user.roles) || hasAdminRole(user.roles)}>
                      <InputLabel>Mã giảm giá</InputLabel>
                      <Select
                        value={''}
                        label="Mã giảm giá"
                        onChange={(e) => handleAssignCoupon(user.id, e.target.value as string)}
                      >
                        {coupons.map((coupon) => (
                          <MenuItem key={coupon.code} value={coupon.code}>
                            {coupon.code} ({coupon.discountValue}% giảm)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {currentUser && (
          <>
            <DialogTitle>Edit User: {currentUser.username}</DialogTitle>
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
                        
                        <MenuItem value="ROLE_SHIPPER">Shipper</MenuItem>
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
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminUsers;