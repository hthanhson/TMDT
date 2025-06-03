import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Paper,
  Chip,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import ShipperService, { 
  Order, 
  StatusUpdateRequest 
} from '../services/shipper.service';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`shipper-tabpanel-${index}`}
      aria-labelledby={`shipper-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </Box>
  );
};

function a11yProps(index: number) {
  return {
    id: `shipper-tab-${index}`,
    'aria-controls': `shipper-tabpanel-${index}`,
  };
}

// Component hiển thị chi tiết đơn hàng
const OrderDetailDialog = ({ open, onClose, order }: { open: boolean; onClose: () => void; order: Order | null }) => {
  if (!order) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Chi tiết đơn hàng #{order.id}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="primary">Thông tin giao hàng</Typography>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2"><strong>Địa chỉ:</strong> {order.shippingAddress}</Typography>
            <Typography variant="body2"><strong>Người nhận:</strong> {order.recipientName}</Typography>
            <Typography variant="body2"><strong>Số điện thoại:</strong> {order.phoneNumber}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="primary">Thông tin thanh toán</Typography>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2"><strong>Phương thức:</strong> {order.paymentMethod}</Typography>
            <Typography variant="body2"><strong>Trạng thái:</strong> {order.paymentStatus}</Typography>
            <Typography variant="body2"><strong>Tổng tiền:</strong> {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(order.totalAmount)}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="primary">Thông tin đơn hàng</Typography>
            <Divider sx={{ mb: 1 }} />
            <Typography variant="body2"><strong>Trạng thái:</strong> 
              <Chip 
                label={order.status} 
                color={getChipColor(order.status)}
                size="small"
                sx={{ ml: 1 }}
              />
            </Typography>
            <Typography variant="body2"><strong>Thời gian tạo:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</Typography>
            <Typography variant="body2"><strong>Cập nhật cuối:</strong> {new Date(order.updatedAt).toLocaleString('vi-VN')}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
};

// Hàm để lấy màu chip (chuyển ra ngoài để có thể sử dụng trong Dialog)
const getChipColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch(status) {
    case 'READY_TO_SHIP': return 'warning';
    case 'PICKED_UP': return 'info';
    case 'IN_TRANSIT': return 'primary';
    case 'ARRIVED_AT_STATION': return 'secondary';
    case 'OUT_FOR_DELIVERY': return 'info';
    case 'DELIVERED': return 'success';
    case 'COMPLETED': return 'success';
    case 'RETURNED': return 'error';
    default: return 'default';
  }
};

const ShipperDashboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [availableOrdersLoading, setAvailableOrdersLoading] = useState<boolean>(false);
  const [myOrdersLoading, setMyOrdersLoading] = useState<boolean>(false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  
  // Pagination states for available orders
  const [availableOrdersPage, setAvailableOrdersPage] = useState(1);
  const [availableOrdersTotal, setAvailableOrdersTotal] = useState(0);
  const [availableOrdersTotalPages, setAvailableOrdersTotalPages] = useState(0);
  
  // Pagination states for my orders
  const [myOrdersPage, setMyOrdersPage] = useState(1);
  const [myOrdersTotal, setMyOrdersTotal] = useState(0);
  const [myOrdersTotalPages, setMyOrdersTotalPages] = useState(0);
  
  // Dialog state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const ordersPerPage = 10;
  
  const { user } = useAuth();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAvailableOrdersPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setAvailableOrdersPage(value);
  };

  const handleMyOrdersPageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setMyOrdersPage(value);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(null);
  };

  useEffect(() => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    
    if (!user.roles.includes("ROLE_SHIPPER")) {
      window.location.href = "/";
      return;
    }
    
    // Initial load
    if (loading) {
      loadAvailableOrders();
      loadMyOrders();
    }
  }, [user, loading]);

  // Load available orders when page changes
  useEffect(() => {
    if (user && user.roles.includes("ROLE_SHIPPER")) {
      loadAvailableOrders();
    }
  }, [availableOrdersPage, refresh]);

  // Load my orders when page changes
  useEffect(() => {
    if (user && user.roles.includes("ROLE_SHIPPER")) {
      loadMyOrders();
    }
  }, [myOrdersPage, refresh]);
  
  const loadAvailableOrders = async () => {
    try {
      setAvailableOrdersLoading(true);
      const response = await ShipperService.getAvailableOrders(availableOrdersPage - 1, ordersPerPage);
      const pageData = response.data;
      console.log("abc",pageData);
      
      setAvailableOrders(pageData.content || []);
      setAvailableOrdersTotal(pageData.totalElements || 0);
      setAvailableOrdersTotalPages(pageData.totalPages || 0);
    } catch (error) {
      console.error("Error loading available orders: ", error);
      setMessage("Có lỗi xảy ra khi tải danh sách đơn hàng có sẵn");
    } finally {
      setAvailableOrdersLoading(false);
      if (loading) setLoading(false);
    }
  };
  
  const loadMyOrders = async () => {
    try {
      setMyOrdersLoading(true);
      const response = await ShipperService.getMyOrders(myOrdersPage - 1, ordersPerPage);
      const pageData = response.data;
      console.log("abc",pageData);
      setMyOrders(pageData.content || []);
      setMyOrdersTotal(pageData.totalElements || 0);
      console.log("bcd",pageData.totalElements);
      setMyOrdersTotalPages(pageData.totalPages || 0);
    } catch (error) {
      console.error("Error loading my orders: ", error);
      setMessage("Có lỗi xảy ra khi tải danh sách đơn hàng của bạn");
    } finally {
      setMyOrdersLoading(false);
      if (loading) setLoading(false);
    }
  };
  
  const acceptOrder = async (orderId: number) => {
    try {
      setLoading(true);
      await ShipperService.acceptOrder(orderId);
      setMessage("Đơn hàng đã được nhận thành công!");
      
      // Reset to first page and refresh both lists
      setAvailableOrdersPage(1);
      setMyOrdersPage(1);
      setRefresh(!refresh);
    } catch (error: any) {
      setMessage("Có lỗi xảy ra khi nhận đơn hàng: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  const updateOrderStatus = async (orderId: number, status: string, location = "Vị trí hiện tại") => {
    const statusUpdateRequest: StatusUpdateRequest = {
      status: status,
      location: location,
      notes: "Cập nhật trạng thái đơn hàng"
    };
    
    try {
      await ShipperService.updateOrderStatus(orderId, statusUpdateRequest);
      setMessage("Cập nhật trạng thái đơn hàng thành công!");
      setRefresh(!refresh);
    } catch (error: any) {
      setMessage("Có lỗi xảy ra khi cập nhật trạng thái: " + (error.response?.data?.message || error.message));
    }
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Shipper
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        Xin chào {user?.fullName || user?.username}
      </Typography>
      
      {message && (
        <Alert severity="info" sx={{ my: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="shipper dashboard tabs">
          <Tab label={`Đơn hàng có sẵn (${availableOrdersTotal})`} {...a11yProps(0)} />
          <Tab label={`Đơn hàng của tôi (${myOrdersTotal})`} {...a11yProps(1)} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardHeader 
            title={`Đơn Hàng Có Sẵn`}
            subheader={`Tổng cộng: ${availableOrdersTotal} đơn hàng`}
            sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}
          />
          <CardContent>
            {availableOrdersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table aria-label="available orders table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '80px' }}>Mã đơn</TableCell>
                        <TableCell sx={{ width: '150px' }}>Người nhận</TableCell>
                        <TableCell sx={{ width: '120px' }}>SĐT</TableCell>
                        <TableCell sx={{ width: '100px' }}>Thanh toán</TableCell>
                        <TableCell sx={{ width: '120px' }}>Tổng tiền</TableCell>
                        <TableCell sx={{ width: '120px' }}>Trạng thái</TableCell>
                        <TableCell sx={{ width: '100px' }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Không có đơn hàng nào có sẵn
                          </TableCell>
                        </TableRow>
                      ) : (
                        availableOrders.map((order) => (
                          <TableRow 
                            key={order.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleOrderClick(order)}
                          >
                            <TableCell>#{order.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {order.recipientName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {order.phoneNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {order.paymentMethod}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(order.totalAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={order.status} 
                                color={getChipColor(order.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="success"
                                onClick={() => acceptOrder(order.id)}
                                disabled={loading}
                              >
                                Nhận đơn
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {availableOrdersTotalPages > 1 && (
                  <Stack spacing={2} sx={{ mt: 3, alignItems: 'center' }}>
                    <Pagination 
                      count={availableOrdersTotalPages} 
                      page={availableOrdersPage} 
                      onChange={handleAvailableOrdersPageChange}
                      color="primary"
                      showFirstButton 
                      showLastButton
                      disabled={availableOrdersLoading}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Trang {availableOrdersPage} / {availableOrdersTotalPages} - 
                      Hiển thị {((availableOrdersPage - 1) * ordersPerPage) + 1}-{Math.min(availableOrdersPage * ordersPerPage, availableOrdersTotal)} của {availableOrdersTotal} đơn hàng
                    </Typography>
                  </Stack>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>
        
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardHeader 
            title={`Đơn Hàng Của Tôi`}
            subheader={`Tổng cộng: ${myOrdersTotal} đơn hàng`}
            sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
          />
          <CardContent>
            {myOrdersLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper}>
                  <Table aria-label="my orders table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '80px' }}>Mã đơn</TableCell>
                        <TableCell sx={{ width: '150px' }}>Người nhận</TableCell>
                        <TableCell sx={{ width: '120px' }}>SĐT</TableCell>
                        <TableCell sx={{ width: '100px' }}>Thanh toán</TableCell>
                        <TableCell sx={{ width: '120px' }}>Tổng tiền</TableCell>
                        <TableCell sx={{ width: '120px' }}>Trạng thái</TableCell>
                        <TableCell sx={{ width: '180px' }}>Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {myOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Bạn chưa có đơn hàng nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        myOrders.map((order) => (
                          <TableRow 
                            key={order.id}
                            hover
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleOrderClick(order)}
                          >
                            <TableCell>#{order.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {order.recipientName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {order.phoneNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {order.paymentMethod}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(order.totalAmount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={order.status} 
                                color={getChipColor(order.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {order.status === 'PICKED_UP' && (
                                  <Button 
                                    size="small" 
                                    variant="contained" 
                                    color="primary"
                                    onClick={() => updateOrderStatus(order.id, 'IN_TRANSIT')}
                                  >
                                    Vận chuyển
                                  </Button>
                                )}
                                
                                {order.status === 'IN_TRANSIT' && (
                                  <>
                                    <Button 
                                      size="small" 
                                      variant="contained" 
                                      color="primary"
                                      onClick={() => updateOrderStatus(order.id, 'ARRIVED_AT_STATION')}
                                    >
                                      Đến trạm
                                    </Button>
                                    <Button 
                                      size="small" 
                                      variant="contained" 
                                      color="info"
                                      onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                                    >
                                      Giao hàng
                                    </Button>
                                  </>
                                )}
                                
                                {order.status === 'ARRIVED_AT_STATION' && (
                                  <Button 
                                    size="small" 
                                    variant="contained" 
                                    color="info"
                                    onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                                  >
                                    Giao hàng
                                  </Button>
                                )}
                                
                                {order.status === 'OUT_FOR_DELIVERY' && (
                                  <>
                                    <Button 
                                      size="small" 
                                      variant="contained" 
                                      color="success"
                                      onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                    >
                                      Đã giao
                                    </Button>
                                    <Button 
                                      size="small" 
                                      variant="contained" 
                                      color="error"
                                      onClick={() => updateOrderStatus(order.id, 'RETURNED')}
                                    >
                                      Hoàn trả
                                    </Button>
                                  </>
                                )}
                                
                                {(order.status === 'DELIVERED' || order.status === 'COMPLETED' || order.status === 'RETURNED') && (
                                  <Typography variant="body2" color="text.secondary">
                                    Đã hoàn thành
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {myOrdersTotalPages > 1 && (
                  <Stack spacing={2} sx={{ mt: 3, alignItems: 'center' }}>
                    <Pagination 
                      count={myOrdersTotalPages} 
                      page={myOrdersPage} 
                      onChange={handleMyOrdersPageChange}
                      color="primary"
                      showFirstButton 
                      showLastButton
                      disabled={myOrdersLoading}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Trang {myOrdersPage} / {myOrdersTotalPages} - 
                      Hiển thị {((myOrdersPage - 1) * ordersPerPage) + 1}-{Math.min(myOrdersPage * ordersPerPage, myOrdersTotal)} của {myOrdersTotal} đơn hàng
                    </Typography>
                  </Stack>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Dialog hiển thị chi tiết đơn hàng */}
      <OrderDetailDialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        order={selectedOrder} 
      />
    </Box>
  );
};

export default ShipperDashboard;