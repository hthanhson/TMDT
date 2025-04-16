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
import { formatCurrency } from '../../utils/formatters';

interface Order {
  id: string;
  userId: string;
  username: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: any[];
  user: any;
  totalAmount: number;
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
      
      console.log('Raw response from AdminService:', response);
      
      // Process any response format
      let processedOrders: any[] = [];
      
      if (response && response.data) {
        // Case 1: Array of orders
        if (Array.isArray(response.data)) {
          processedOrders = response.data;
        } 
        // Case 2: Paginated response
        else if (response.data.content && Array.isArray(response.data.content)) {
          processedOrders = response.data.content;
        }
        // Case 3: Single object response (could be the last item in array)
        else if (response.data.id) {
          processedOrders = [response.data];
        }
        
        console.log('Processed orders before normalization:', processedOrders);
        
        // Normalize each order object to have consistent properties
        const normalizedOrders = processedOrders.map((order: any) => {
          // Make a copy to avoid modifying the original
          const normalizedOrder = { ...order };
          
          // Handle case where user is a number rather than an object
          if (typeof normalizedOrder.user === 'number' && !normalizedOrder.userId) {
            normalizedOrder.userId = normalizedOrder.user;
          }
          
          // Ensure required fields have values
          if (!normalizedOrder.id) normalizedOrder.id = '';
          if (!normalizedOrder.status) normalizedOrder.status = 'UNKNOWN';
          if (!normalizedOrder.totalAmount) normalizedOrder.totalAmount = 0;
          if (!normalizedOrder.createdAt) normalizedOrder.createdAt = '';
          if (!normalizedOrder.updatedAt) normalizedOrder.updatedAt = '';
          
          return normalizedOrder;
        });
        
        console.log('Normalized orders:', normalizedOrders);
        setOrders(normalizedOrders);
      } else {
        console.warn('No data in response:', response);
        setOrders([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const isValidStatusTransition = (currentStatus: string, newStatus: string): boolean => {
    const validTransitions: { [key: string]: string[] } = {
      'PENDING': ['PROCESSING', 'CANCELLED', 'ON_HOLD', 'CONFIRMED'],
      'CONFIRMED': ['PROCESSING', 'READY_TO_SHIP', 'CANCELLED', 'ON_HOLD'],
      'PROCESSING': ['READY_TO_SHIP', 'SHIPPED', 'IN_TRANSIT', 'CANCELLED', 'ON_HOLD'],
      'READY_TO_SHIP': ['IN_TRANSIT', 'CANCELLED'],
      'SHIPPED': ['IN_TRANSIT', 'ARRIVED_AT_STATION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      'IN_TRANSIT': ['ARRIVED_AT_STATION', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      'ARRIVED_AT_STATION': ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'CANCELLED'],
      'OUT_FOR_DELIVERY': ['DELIVERED', 'RETURNED', 'CANCELLED'],
      'DELIVERED': ['COMPLETED', 'RETURNED', 'REFUNDED'],
      'COMPLETED': ['RETURNED', 'REFUNDED'],
      'ON_HOLD': ['PROCESSING', 'CANCELLED'],
      'CANCELLED': ['REFUNDED'],
      'RETURNED': ['REFUNDED'],
      'REFUNDED': []
    };
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  const handleStatusChange = async (orderId: string, newStatus: string, currentStatus: string) => {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      setError(`Invalid status transition from ${currentStatus} to ${newStatus}`);
      return;
    }

    try {
      await AdminService.updateOrderStatus(orderId, newStatus);
      fetchOrders(); // Refresh the orders list
      setError(null);
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
      case 'REFUNDED':
        return 'secondary';
      case 'ON_HOLD':
        return 'default';
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
            {Array.isArray(orders) && orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>
                    {order.createdAt && format(new Date(order.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {typeof order.user === 'object' && order.user 
                      ? (order.user?.fullName || order.user?.username || 'Unknown') 
                      : `User ID: ${order.userId || (typeof order.user === 'number' ? order.user : 'Unknown')}`}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(order.totalAmount) || 0)}</TableCell>
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
                          value={order.status || ''}
                          label="Status"
                          onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                          disabled={order.status === 'DELIVERED' || order.status === 'CANCELLED' || order.status === 'RETURNED'}
                        >
                          <MenuItem value="PENDING" disabled={!isValidStatusTransition(order.status, 'PENDING')}>Pending</MenuItem>
                          <MenuItem value="CONFIRMED" disabled={!isValidStatusTransition(order.status, 'CONFIRMED')}>Confirmed</MenuItem>
                          <MenuItem value="PROCESSING" disabled={!isValidStatusTransition(order.status, 'PROCESSING')}>Processing</MenuItem>
                          <MenuItem value="READY_TO_SHIP" disabled={!isValidStatusTransition(order.status, 'READY_TO_SHIP')}>Ready to Ship</MenuItem>
                          <MenuItem value="SHIPPED" disabled={!isValidStatusTransition(order.status, 'SHIPPED')}>Shipped</MenuItem>
                          <MenuItem value="IN_TRANSIT" disabled={!isValidStatusTransition(order.status, 'IN_TRANSIT')}>In Transit</MenuItem>
                          <MenuItem value="ARRIVED_AT_STATION" disabled={!isValidStatusTransition(order.status, 'ARRIVED_AT_STATION')}>Arrived at Station</MenuItem>
                          <MenuItem value="OUT_FOR_DELIVERY" disabled={!isValidStatusTransition(order.status, 'OUT_FOR_DELIVERY')}>Out for Delivery</MenuItem>
                          <MenuItem value="DELIVERED" disabled={!isValidStatusTransition(order.status, 'DELIVERED')}>Delivered</MenuItem>
                          <MenuItem value="COMPLETED" disabled={!isValidStatusTransition(order.status, 'COMPLETED')}>Completed</MenuItem>
                          <MenuItem value="CANCELLED" disabled={!isValidStatusTransition(order.status, 'CANCELLED')}>Cancelled</MenuItem>
                          <MenuItem value="RETURNED" disabled={!isValidStatusTransition(order.status, 'RETURNED')}>Returned</MenuItem>

                          <MenuItem value="ON_HOLD" disabled={!isValidStatusTransition(order.status, 'ON_HOLD')}>On Hold</MenuItem>
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
              ))
            ) : (
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
                    <strong>Date:</strong> {selectedOrder.createdAt && format(new Date(selectedOrder.createdAt), 'PPP')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Customer:</strong> {
                      typeof selectedOrder.user === 'object' && selectedOrder.user
                        ? (selectedOrder.user?.fullName || selectedOrder.user?.username || 'Unknown')
                        : `User ID: ${selectedOrder.userId || (typeof selectedOrder.user === 'number' ? selectedOrder.user : 'Unknown')}`
                    }
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {
                      typeof selectedOrder.user === 'object' && selectedOrder.user
                        ? selectedOrder.user?.email || 'N/A'
                        : 'N/A'
                    }
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
                    {Array.isArray(selectedOrder.orderItems) && selectedOrder.orderItems.map((item: any) => (
                      <React.Fragment key={item.id}>
                        <ListItem>
                          <ListItemText
                            primary={item.productName}
                            secondary={`Quantity: ${item.quantity}`}
                          />
                          <Typography>
                            {formatCurrency(parseFloat(item.price) * item.quantity)}
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
                        {formatCurrency(Number(selectedOrder.totalAmount) || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'RETURNED' && (
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="status-update-label">Update Status</InputLabel>
                  <Select
                    labelId="status-update-label"
                    value={selectedOrder.status}
                    label="Update Status"
                    onChange={(e) => {
                      handleStatusChange(selectedOrder.id, e.target.value, selectedOrder.status);
                      handleCloseDialog();
                    }}
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="CONFIRMED">Confirmed</MenuItem>
                    <MenuItem value="PROCESSING">Processing</MenuItem>
                    <MenuItem value="READY_TO_SHIP">Ready to Ship</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
                    <MenuItem value="ARRIVED_AT_STATION">Arrived at Station</MenuItem>
                    <MenuItem value="OUT_FOR_DELIVERY">Out for Delivery</MenuItem>
                    <MenuItem value="DELIVERED">Delivered</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    <MenuItem value="RETURNED">Returned</MenuItem>
                    <MenuItem value="REFUNDED">Refunded</MenuItem>
                    <MenuItem value="ON_HOLD">On Hold</MenuItem>
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