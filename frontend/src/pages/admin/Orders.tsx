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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { format } from 'date-fns';
import AdminService from '../../services/AdminService';

interface Order {
  id: string;
  userId: string;
  username: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: any[];
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAllOrders();
      setOrders(response.data.content);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await AdminService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh the orders list
    } catch (err: any) {
      console.error('Error updating order status:', err);
      setError(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleOpenDialog = (order: any) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Order Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>
                  {format(new Date(order.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>{order.user?.fullName || order.user?.username}</TableCell>
                <TableCell>${parseFloat(order.totalAmount).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={order.status}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 120, mr: 1 }}>
                      <InputLabel id={`status-label-${order.id}`}>Status</InputLabel>
                      <Select
                        labelId={`status-label-${order.id}`}
                        value={order.status}
                        label="Status"
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                      >
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="PROCESSING">Processing</MenuItem>
                        <MenuItem value="SHIPPED">Shipped</MenuItem>
                        <MenuItem value="DELIVERED">Delivered</MenuItem>
                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleOpenDialog(order)}
                    >
                      Details
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle>
              Order #{selectedOrder.id} Details
              <Chip
                label={selectedOrder.status}
                color={getStatusColor(selectedOrder.status)}
                size="small"
                sx={{ ml: 2 }}
              />
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Order Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Date:</strong> {format(new Date(selectedOrder.createdAt), 'PPP')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Customer:</strong> {selectedOrder.user?.fullName || selectedOrder.user?.username}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedOrder.user?.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
                  </Typography>
                  
                  <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
                    Shipping Address
                  </Typography>
                  <Typography variant="body2">
                    {selectedOrder.shippingAddress}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Order Items
                  </Typography>
                  <List>
                    {selectedOrder.orderItems?.map((item: any) => (
                      <React.Fragment key={item.id}>
                        <ListItem>
                          <ListItemText
                            primary={item.productName}
                            secondary={`Quantity: ${item.quantity}`}
                          />
                          <Typography>
                            ${parseFloat(item.price).toFixed(2)} × {item.quantity} = $
                            {(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </Typography>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6">
                        ${parseFloat(selectedOrder.totalAmount).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="status-update-label">Update Status</InputLabel>
                  <Select
                    labelId="status-update-label"
                    value={selectedOrder.status}
                    label="Update Status"
                    onChange={(e) => {
                      handleStatusChange(selectedOrder.id, e.target.value);
                      handleCloseDialog();
                    }}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PROCESSING">Processing</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="DELIVERED">Delivered</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminOrders; 