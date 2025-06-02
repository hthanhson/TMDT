import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  Person as UserIcon,
  Inventory as ProductIcon,
  Paid as RevenueIcon,
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  LocalOffer as PromotionIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import AdminService from '../../services/AdminService';
import NotificationService from '../../services/NotificationService';
import { Notification } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ValueType } from 'recharts';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Helper para formatação de moeda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Danh sách các tháng
const MONTHS = [
  { value: 1, label: 'Tháng 1' },
  { value: 2, label: 'Tháng 2' },
  { value: 3, label: 'Tháng 3' },
  { value: 4, label: 'Tháng 4' },
  { value: 5, label: 'Tháng 5' },
  { value: 6, label: 'Tháng 6' },
  { value: 7, label: 'Tháng 7' },
  { value: 8, label: 'Tháng 8' },
  { value: 9, label: 'Tháng 9' },
  { value: 10, label: 'Tháng 10' },
  { value: 11, label: 'Tháng 11' },
  { value: 12, label: 'Tháng 12' }
];

// Tạo danh sách năm (từ 2020 đến năm hiện tại)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2019 }, (_, i) => ({ 
  value: 2020 + i, 
  label: `Năm ${2020 + i}` 
}));

// Thêm hàm helper để xử lý an toàn việc chuyển đổi giữa string và number
const safeParseFloat = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Định nghĩa interface cho dữ liệu đơn hàng
interface OrderData {
  id: string;
  date?: string;
  status?: string;
  amount: number;
  totalAmount?: number;
  customerName?: string;
  paymentMethod?: string;
  [key: string]: any; // Cho phép các trường khác
}

// Định nghĩa interface cho dữ liệu sản phẩm
interface ProductData {
  id: string;
  name: string;
  stock: number;
  sales?: number;
  revenue?: number;
  price?: number;
  category?: string;
  imageUrl?: string;
  [key: string]: any; // Cho phép các trường khác
}

// Định nghĩa interface cho dữ liệu dashboard
interface DashboardApiResponse {
  totalUsers: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  recentOrders: OrderData[];
  productPerformance: ProductData[];
  [key: string]: any; // Cho phép các trường khác
}

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>({
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    outOfStockProducts: 0,
    totalRevenue: 0,
    recentOrders: [],
    topProducts: [],
    stats: {},
    salesData: []
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  
  // Thêm state cho bộ lọc
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filteredSalesData, setFilteredSalesData] = useState<any[]>([]);
  const [filteredDeliveredRevenue, setFilteredDeliveredRevenue] = useState<number>(0);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, [selectedMonth, selectedYear]); // Thêm dependency vào useEffect

  // Hàm xử lý khi thay đổi tháng
  const handleMonthChange = (event: SelectChangeEvent<number>) => {
    setSelectedMonth(event.target.value as number);
  };

  // Hàm xử lý khi thay đổi năm
  const handleYearChange = (event: SelectChangeEvent<number>) => {
    setSelectedYear(event.target.value as number);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching dashboard data...");
      console.log(`Filters: Month ${selectedMonth}, Year ${selectedYear}`);
      
      // Lấy dữ liệu từ backend qua endpoint /admin/dashboard
      const dashboardResponse = await AdminService.getDashboardStats() as DashboardApiResponse;
      
      console.log("Dashboard response:", dashboardResponse);
      
      // Lấy danh sách đơn hàng
      let recentOrders: OrderData[] = Array.isArray(dashboardResponse.recentOrders) 
        ? dashboardResponse.recentOrders 
        : [];
        
      // Lấy danh sách sản phẩm bán chạy
      const topProducts: ProductData[] = Array.isArray(dashboardResponse.productPerformance) 
        ? dashboardResponse.productPerformance 
        : [];
      
      console.log("Raw data:", { recentOrders, topProducts });
      
      // Lọc đơn hàng theo tháng/năm được chọn
      const filteredOrders: OrderData[] = recentOrders.filter((order: OrderData) => {
        if (!order.date) return false;
        
        const orderDate = new Date(order.date);
        return orderDate.getMonth() + 1 === selectedMonth && 
               orderDate.getFullYear() === selectedYear;
      });
      
      console.log(`Filtered orders for ${selectedMonth}/${selectedYear}:`, filteredOrders);
      
      // Tính tổng số đơn hàng theo bộ lọc
      const totalFilteredOrders = filteredOrders.length;
      
      // Tính toán doanh thu từ các đơn hàng đã giao (DELIVERED) trong tháng đã chọn
      let filteredRevenue = 0;
      
      // Chỉ tính doanh thu từ đơn hàng đã giao (DELIVERED)
      const deliveredOrders: OrderData[] = filteredOrders.filter((order: OrderData) => 
        order.status && order.status.toUpperCase() === 'DELIVERED');
        
      console.log(`Delivered orders for ${selectedMonth}/${selectedYear}:`, deliveredOrders);
      
      // Tính tổng doanh thu từ đơn hàng đã giao
      filteredRevenue = deliveredOrders.reduce((total: number, order: OrderData) => {
        return total + safeParseFloat(order.amount);
      }, 0);
      
      console.log(`Revenue for ${selectedMonth}/${selectedYear}:`, filteredRevenue);
      
      // Cập nhật revenue hiển thị
      setFilteredDeliveredRevenue(filteredRevenue);
      
      // Dữ liệu cơ bản từ API - hiển thị dữ liệu đã lọc thay vì tổng số
      const stats = {
        totalOrders: totalFilteredOrders, // Chỉ đếm đơn hàng trong tháng đã lọc
        totalUsers: dashboardResponse.totalUsers || 0,
        totalProducts: dashboardResponse.totalProducts || 0,
        totalRevenue: filteredRevenue // Chỉ hiển thị doanh thu trong tháng đã lọc
      };
      
      // Tạo dữ liệu cho biểu đồ doanh thu
      const monthlyData = [
        {
          month: `T${selectedMonth}`,
          sales: filteredRevenue,
          date: `${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`
        }
      ];
      
      setFilteredSalesData(monthlyData);
      
      // Tạo dữ liệu cho biểu đồ trạng thái đơn hàng
      if (filteredOrders.length > 0) {
        const statusCounts: Record<string, number> = {};
        
        filteredOrders.forEach((order: OrderData) => {
          const status = order.status?.toUpperCase() || 'UNKNOWN';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        setOrderStatusData(statusData);
      } else {
        // Nếu không có đơn hàng nào cho tháng này, sử dụng dữ liệu trống
        setOrderStatusData([
          { name: 'DELIVERED', value: 0 },
          { name: 'PROCESSING', value: 0 },
          { name: 'PENDING', value: 0 }
        ]);
      }
      
      // Cập nhật dữ liệu dashboard
      setDashboardData({
        stats,
        recentOrders: filteredOrders,
        topProducts,
        salesData: monthlyData
      });
      
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationLoading(true);
      const response = await NotificationService.getNotifications();
      setNotifications(response.data);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    } finally {
      setNotificationLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
        return <OrderIcon color="primary" />;
      case 'PROMOTION':
        return <PromotionIcon color="secondary" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch (e) {
      return 'mới đây';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'success.main';
      case 'CANCELLED':
      case 'REJECTED':
        return 'error.main';
      case 'SHIPPED':
      case 'PROCESSING':
        return 'info.main';
      case 'PENDING':
      case 'WAITING':
        return 'warning.main';
      default:
        return 'text.secondary';
    }
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
      <Typography variant="h4" gutterBottom>
        Bảng điều khiển quản trị
      </Typography>

      {/* Bộ lọc thời gian */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Bộ lọc thời gian</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="month-select-label">Tháng</InputLabel>
              <Select
                labelId="month-select-label"
                id="month-select"
                value={selectedMonth}
                label="Tháng"
                onChange={handleMonthChange}
              >
                {MONTHS.map((month) => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="year-select-label">Năm</InputLabel>
              <Select
                labelId="year-select-label"
                id="year-select"
                value={selectedYear}
                label="Năm"
                onChange={handleYearChange}
              >
                {YEARS.map((year) => (
                  <MenuItem key={year.value} value={year.value}>
                    {year.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Order Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            }}
          >
            <OrderIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">{dashboardData.stats?.totalOrders || 0}</Typography>
            <Typography variant="subtitle1">Đơn hàng tháng {selectedMonth}/{selectedYear}</Typography>
          </Paper>
        </Grid>

        {/* User Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'success.contrastText',
            }}
          >
            <UserIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">{dashboardData.stats?.totalUsers || 0}</Typography>
            <Typography variant="subtitle1">Người dùng</Typography>
          </Paper>
        </Grid>

        {/* Product Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'warning.light',
              color: 'warning.contrastText',
            }}
          >
            <ProductIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">{dashboardData.stats?.totalProducts || 0}</Typography>
            <Typography variant="subtitle1">Sản phẩm</Typography>
          </Paper>
        </Grid>

        {/* Revenue Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'info.light',
              color: 'info.contrastText',
            }}
          >
            <RevenueIcon sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h5">
              {formatCurrency(filteredDeliveredRevenue || dashboardData.stats?.totalRevenue || 0)}
            </Typography>
            <Typography variant="subtitle1">Doanh thu tháng {selectedMonth}/{selectedYear}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Đơn hàng gần đây
              </Typography>
              <Divider sx={{ my: 1 }} />
              {Array.isArray(dashboardData.recentOrders) && dashboardData.recentOrders.length > 0 ? (
                // Chỉ hiển thị 5 đơn hàng gần đây nhất từ danh sách đã lọc
                dashboardData.recentOrders
                  .sort((a: OrderData, b: OrderData) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
                  .slice(0, 5)
                  .map((order: any) => (
                  <Box key={order.id} sx={{ mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">
                          #{order.id}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          {formatCurrency(safeParseFloat(order.totalAmount) || safeParseFloat(order.amount))}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: getStatusColor(order.status)
                          }}
                        >
                          {order.status}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Không có đơn hàng gần đây
                </Typography>
              )}
              <Button
                component={RouterLink}
                to="/admin/orders"
                size="small"
                sx={{ mt: 1 }}
              >
                Xem tất cả đơn hàng
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sản phẩm bán chạy
              </Typography>
              <Divider sx={{ my: 1 }} />
              {Array.isArray(dashboardData.topProducts) && dashboardData.topProducts.length > 0 ? (
                dashboardData.topProducts.map((product: any) => (
                  <Box key={product.id} sx={{ mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={1}>
                        <Avatar
                          alt={product.name}
                          src={product.imageUrl}
                          variant="rounded"
                          sx={{ width: 40, height: 40 }}
                        />
                      </Grid>
                      <Grid item xs={5}>
                        <Typography variant="body2" noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {product.category}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(safeParseFloat(product.price))}
                        </Typography>
                        <Typography variant="caption">
                          Đã bán: {product.sales || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography 
                          variant="body2" 
                          color={product.stock > 10 ? "success.main" : (product.stock > 0 ? "warning.main" : "error.main")}
                        >
                          Còn: {product.stock || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Không có dữ liệu sản phẩm
                </Typography>
              )}
              <Button
                component={RouterLink}
                to="/admin/products"
                size="small"
                sx={{ mt: 1 }}
              >
                Xem tất cả sản phẩm
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sales Report Section */}
      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          Báo cáo doanh thu
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Doanh thu theo tháng (Đã giao)
                </Typography>
                <Box height={300}>
                  {filteredSalesData && filteredSalesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={filteredSalesData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value: ValueType) => {
                            if (typeof value === 'number') {
                              return formatCurrency(value);
                            }
                            return value;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="sales" name="Doanh thu" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography color="textSecondary">Không có dữ liệu doanh thu</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Trạng thái đơn hàng
                </Typography>
                <Box height={300}>
                  {orderStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {orderStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: ValueType) => {
                          if (Array.isArray(value)) {
                            return String(value);
                          }
                          return value;
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography color="textSecondary">Không có dữ liệu trạng thái đơn hàng</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      
      
    </Box>
  );
};

export default AdminDashboard; 