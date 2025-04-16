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
  CircularProgress
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

const ShipperDashboard = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [refresh, setRefresh] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  
  const { user } = useAuth();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
    
    // Tải danh sách đơn hàng có sẵn
    loadAvailableOrders();
    
    // Tải danh sách đơn hàng của shipper
    loadMyOrders();
  }, [refresh, user]);
  
  const loadAvailableOrders = () => {
    ShipperService.getAvailableOrders()
      .then(response => {
        setAvailableOrders(response.data.content || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading available orders: ", error);
        setLoading(false);
      });
  };
  
  const loadMyOrders = () => {
    ShipperService.getMyOrders()
      .then(response => {
        setMyOrders(response.data.content || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading my orders: ", error);
        setLoading(false);
      });
  };
  
  const acceptOrder = (orderId: number) => {
    setLoading(true);
    ShipperService.acceptOrder(orderId)
      .then(response => {
        setMessage("Đơn hàng đã được nhận thành công!");
        setRefresh(!refresh);
      })
      .catch(error => {
        setMessage("Có lỗi xảy ra khi nhận đơn hàng: " + (error.response?.data?.message || error.message));
        setLoading(false);
      });
  };
  
  const updateOrderStatus = (orderId: number, status: string, location = "Vị trí hiện tại") => {
    const statusUpdateRequest: StatusUpdateRequest = {
      status: status,
      location: location,
      notes: "Cập nhật trạng thái đơn hàng"
    };
    
    ShipperService.updateOrderStatus(orderId, statusUpdateRequest)
      .then(response => {
        setMessage("Cập nhật trạng thái đơn hàng thành công!");
        setRefresh(!refresh);
      })
      .catch(error => {
        setMessage("Có lỗi xảy ra khi cập nhật trạng thái: " + (error.response?.data?.message || error.message));
      });
  };
  
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
  
  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="body1" gutterBottom>
        Xin chào {user?.fullName || user?.username}
      </Typography>
      
      {message && (
        <Alert severity="info" sx={{ my: 2 }}>
          {message}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="shipper dashboard tabs">
          <Tab label="Đơn hàng có sẵn" {...a11yProps(0)} />
          <Tab label="Đơn hàng của tôi" {...a11yProps(1)} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardHeader 
            title="Đơn Hàng Có Sẵn"
            sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}
          />
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="available orders table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã đơn</TableCell>
                      <TableCell>Địa chỉ giao hàng</TableCell>
                      <TableCell>Thời gian tạo</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {availableOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">Không có đơn hàng nào có sẵn</TableCell>
                      </TableRow>
                    ) : (
                      availableOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.shippingAddress}</TableCell>
                          <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status} 
                              color={getChipColor(order.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="contained" 
                              color="success"
                              onClick={() => acceptOrder(order.id)}
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
            )}
          </CardContent>
        </Card>
      </TabPanel>
        
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardHeader 
            title="Đơn Hàng Của Tôi"
            sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
          />
          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="my orders table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã đơn</TableCell>
                      <TableCell>Địa chỉ giao hàng</TableCell>
                      <TableCell>Người nhận</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">Bạn chưa có đơn hàng nào</TableCell>
                      </TableRow>
                    ) : (
                      myOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.shippingAddress}</TableCell>
                          <TableCell>{order.recipientName}</TableCell>
                          <TableCell>
                            <Chip 
                              label={order.status} 
                              color={getChipColor(order.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {order.status === 'PICKED_UP' && (
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="primary"
                                sx={{ mr: 1, mb: 1 }}
                                onClick={() => updateOrderStatus(order.id, 'IN_TRANSIT')}
                              >
                                Đang vận chuyển
                              </Button>
                            )}
                            
                            {order.status === 'IN_TRANSIT' && (
                              <>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="primary"
                                  sx={{ mr: 1, mb: 1 }}
                                  onClick={() => updateOrderStatus(order.id, 'ARRIVED_AT_STATION')}
                                >
                                  Đến trạm
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="info"
                                  sx={{ mr: 1, mb: 1 }}
                                  onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                                >
                                  Đang giao
                                </Button>
                              </>
                            )}
                            
                            {order.status === 'ARRIVED_AT_STATION' && (
                              <Button 
                                size="small" 
                                variant="contained" 
                                color="info"
                                sx={{ mr: 1, mb: 1 }}
                                onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                              >
                                Đang giao
                              </Button>
                            )}
                            
                            {order.status === 'OUT_FOR_DELIVERY' && (
                              <>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="success"
                                  sx={{ mr: 1, mb: 1 }}
                                  onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                                >
                                  Đã giao
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="contained" 
                                  color="error"
                                  sx={{ mb: 1 }}
                                  onClick={() => updateOrderStatus(order.id, 'RETURNED')}
                                >
                                  Hoàn trả
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default ShipperDashboard; 