import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip
} from '@mui/material';
import { 
  DownloadOutlined as DownloadIcon,
  BarChart as ChartIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingBag as OrdersIcon,
  People as UsersIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import AdminService from '../../services/AdminService';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { toast } from 'react-toastify';
import type { ValueType } from 'recharts';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
  revenueGrowth?: number;
  orderGrowth?: number;
  customerGrowth?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Helper para formatação de moeda
const formatCurrency = (amount: number | string) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount || 0);
};

// Cores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const CHART_COLORS = {
  revenue: '#8884d8',
  orders: '#82ca9d',
  customers: '#ffc658',
  primary: '#3f51b5',
  secondary: '#f50057',
  success: '#4caf50',
  info: '#2196f3',
  warning: '#ff9800',
  error: '#f44336'
};

// Função helper para agrupar produtos por categoria
const getCategoryDistribution = (products: any[]) => {
  const categoryMap = new Map<string, number>();
  
  products.forEach(product => {
    const category = product.category || 'Outros';
    const revenue = typeof product.revenue === 'number' ? product.revenue : 0;
    
    if (categoryMap.has(category)) {
      categoryMap.set(category, categoryMap.get(category)! + revenue);
    } else {
      categoryMap.set(category, revenue);
    }
  });
  
  return Array.from(categoryMap).map(([name, value]) => ({ name, value }));
};

const AdminReports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sales report state
  const [salesData, setSalesData] = useState<ReportData | null>(null);
  const [salesFilter, setSalesFilter] = useState({
    period: 'month',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  });
  
  // Products report state
  const [productsData, setProductsData] = useState<any[]>([]);
  const [productsFilter, setProductsFilter] = useState({
    period: 'month',
    category: '',
    sortBy: 'sales'
  });
  
  // Users report state
  const [usersData, setUsersData] = useState<any[]>([]);
  const [usersFilter, setUsersFilter] = useState({
    period: 'month',
    sortBy: 'orders'
  });
  
  // Orders report state
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [ordersFilter, setOrdersFilter] = useState({
    period: 'month',
    status: ''
  });
  
  // Summary data
  const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageOrderValue: 0
  });
  
  useEffect(() => {
    if (tabValue === 0) {
      fetchSalesReport();
      fetchSummaryData();
    } else if (tabValue === 1) {
      fetchProductsReport();
    } else if (tabValue === 2) {
      fetchUsersReport();
    } else if (tabValue === 3) {
      fetchOrdersReport();
    }
  }, [tabValue, salesFilter.period, productsFilter.period, usersFilter.period, ordersFilter.period]);
  
  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const params = {
        period: salesFilter.period,
        startDate: salesFilter.startDate.toISOString().split('T')[0],
        endDate: salesFilter.endDate.toISOString().split('T')[0]
      };
      
      const response = await AdminService.getSalesReport(params);
      
      // Processar os dados para o gráfico, se necessário
      let chartData = response.data;
      if (!chartData.labels || !chartData.datasets) {
        // Dados estão em formato diferente, converter para o formato esperado
        if (Array.isArray(chartData)) {
          // Já é um array de objetos
          setSalesData({
            labels: chartData.map(item => item.label || item.date || item.period),
            datasets: [{
              label: 'Doanh thu',
              data: chartData.map(item => item.revenue || item.value || 0),
              backgroundColor: CHART_COLORS.revenue,
              borderColor: CHART_COLORS.revenue
            }]
          });
        } else {
          // Dados vazios ou formato desconhecido
          setSalesData({
            labels: [],
            datasets: [{
              label: 'Doanh thu',
              data: [],
              backgroundColor: CHART_COLORS.revenue,
              borderColor: CHART_COLORS.revenue
            }]
          });
        }
      } else {
        setSalesData(chartData);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching sales report:', err);
      setError(err.response?.data?.message || 'Failed to fetch sales report');
      
      // Usar dados de exemplo em caso de erro
      setSalesData({
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        datasets: [{
          label: 'Doanh thu',
          data: [12000000, 19000000, 13000000, 15000000, 22000000, 18000000, 24000000, 25000000, 17000000, 18000000, 21000000, 26000000],
          backgroundColor: CHART_COLORS.revenue,
          borderColor: CHART_COLORS.revenue
        }]
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProductsReport = async () => {
    try {
      setLoading(true);
      const params = {
        period: productsFilter.period,
        category: productsFilter.category,
        sortBy: productsFilter.sortBy
      };
      
      const response = await AdminService.getProductsReport(params);
      
      // Verificar e processar os dados recebidos
      if (response.data) {
        const productData = response.data;
        
        if (Array.isArray(productData)) {
          // Dados já estão no formato adequado
          setProductsData(productData);
        } else if (typeof productData === 'object') {
          // Precisamos converter o objeto para array
          const productsArray = [];
          for (const key in productData) {
            if (Object.prototype.hasOwnProperty.call(productData, key)) {
              productsArray.push({
                id: key,
                name: productData[key].name || key,
                quantity: productData[key].quantity || 0,
                revenue: productData[key].revenue || 0,
                ...productData[key]
              });
            }
          }
          setProductsData(productsArray);
        } else {
          setProductsData([]);
        }
      } else {
        setProductsData([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products report:', err);
      setError(err.response?.data?.message || 'Failed to fetch products report');
      
      // Dados de exemplo em caso de erro
      setProductsData([
        { id: '1', name: 'iPhone 13 Pro', quantity: 120, revenue: 250000000, category: 'Điện thoại' },
        { id: '2', name: 'Samsung Galaxy S21', quantity: 95, revenue: 180000000, category: 'Điện thoại' },
        { id: '3', name: 'MacBook Pro M1', quantity: 65, revenue: 220000000, category: 'Laptop' },
        { id: '4', name: 'AirPods Pro', quantity: 200, revenue: 80000000, category: 'Phụ kiện' },
        { id: '5', name: 'iPad Air', quantity: 75, revenue: 150000000, category: 'Tablet' }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUsersReport = async () => {
    try {
      setLoading(true);
      const params = {
        period: usersFilter.period,
        sortBy: usersFilter.sortBy
      };
      
      const response = await AdminService.getUsersReport(params);
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          setUsersData(response.data);
        } else if (response.data.users && Array.isArray(response.data.users)) {
          setUsersData(response.data.users);
        } else {
          setUsersData([]);
        }
      } else {
        setUsersData([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users report:', err);
      setError(err.response?.data?.message || 'Failed to fetch users report');
      
      // Dados de exemplo em caso de erro
      setUsersData([
        { id: '1', name: 'Nguyễn Văn A', orderCount: 12, totalSpent: 25000000, lastOrderDate: '2023-10-15' },
        { id: '2', name: 'Trần Thị B', orderCount: 8, totalSpent: 15000000, lastOrderDate: '2023-10-20' },
        { id: '3', name: 'Lê Văn C', orderCount: 15, totalSpent: 30000000, lastOrderDate: '2023-10-18' },
        { id: '4', name: 'Phạm Văn D', orderCount: 6, totalSpent: 12000000, lastOrderDate: '2023-10-22' },
        { id: '5', name: 'Hoàng Thị E', orderCount: 10, totalSpent: 20000000, lastOrderDate: '2023-10-19' }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOrdersReport = async () => {
    try {
      setLoading(true);
      const params = {
        period: ordersFilter.period,
        status: ordersFilter.status
      };
      
      const response = await AdminService.getOrdersReport(params);
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          setOrdersData(response.data);
        } else if (response.data.orders && Array.isArray(response.data.orders)) {
          setOrdersData(response.data.orders);
        } else {
          setOrdersData([]);
        }
      } else {
        setOrdersData([]);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders report:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders report');
      
      // Dados de exemplo em caso de erro
      setOrdersData([
        { id: '1', date: '2023-10-15', status: 'DELIVERED', total: 2500000, paymentMethod: 'COD' },
        { id: '2', date: '2023-10-16', status: 'PROCESSING', total: 1500000, paymentMethod: 'BANK_TRANSFER' },
        { id: '3', date: '2023-10-17', status: 'SHIPPED', total: 3000000, paymentMethod: 'COD' },
        { id: '4', date: '2023-10-18', status: 'CANCELLED', total: 1200000, paymentMethod: 'E_WALLET' },
        { id: '5', date: '2023-10-19', status: 'DELIVERED', total: 2000000, paymentMethod: 'BANK_TRANSFER' }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSummaryData = async () => {
    try {
      const statsResponse = await AdminService.getDashboardStats();
      const stats = statsResponse.data;
      
      setSummaryData({
        totalSales: stats.totalRevenue || 0,
        totalOrders: stats.totalOrders || 0,
        totalCustomers: stats.totalUsers || 0,
        averageOrderValue: stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0
      });
    } catch (err) {
      console.error('Error fetching summary data:', err);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleExportReport = async (reportType: string) => {
    try {
      let params = {};
      
      switch (reportType) {
        case 'sales':
          params = {
            period: salesFilter.period,
            startDate: salesFilter.startDate.toISOString().split('T')[0],
            endDate: salesFilter.endDate.toISOString().split('T')[0]
          };
          break;
        case 'products':
          params = {
            period: productsFilter.period,
            category: productsFilter.category,
            sortBy: productsFilter.sortBy
          };
          break;
        case 'users':
          params = {
            period: usersFilter.period,
            sortBy: usersFilter.sortBy
          };
          break;
        case 'orders':
          params = {
            period: ordersFilter.period,
            status: ordersFilter.status
          };
          break;
      }
      
      const response = await AdminService.exportReport(reportType, params);
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: 'application/vnd.ms-excel' });
      
      // Create a link element
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.xlsx`);
      
      // Append to the document
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (err: any) {
      console.error('Error exporting report:', err);
      toast.error(err.response?.data?.message || 'Failed to export report');
    }
  };
  
  const handleSalesFilterChange = (field: string, value: any) => {
    setSalesFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleProductsFilterChange = (field: string, value: any) => {
    setProductsFilter(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'period' || field === 'category' || field === 'sortBy') {
      fetchProductsReport();
    }
  };
  
  const handleUsersFilterChange = (field: string, value: any) => {
    setUsersFilter(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'period' || field === 'sortBy') {
      fetchUsersReport();
    }
  };
  
  const handleOrdersFilterChange = (field: string, value: any) => {
    setOrdersFilter(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'period' || field === 'status') {
      fetchOrdersReport();
    }
  };
  
  // Helper para formatar datas
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Helper para obter estatísticas de status de pedidos
  const getOrderStatusDistribution = () => {
    const statusMap = new Map<string, number>();
    
    ordersData.forEach(order => {
      const status = order.status || 'UNKNOWN';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    return Array.from(statusMap).map(([name, value]) => ({ name, value }));
  };
  
  // Helper para obter estatísticas de métodos de pagamento
  const getPaymentMethodDistribution = () => {
    const paymentMap = new Map<string, number>();
    
    ordersData.forEach(order => {
      const method = order.paymentMethod || 'UNKNOWN';
      paymentMap.set(method, (paymentMap.get(method) || 0) + 1);
    });
    
    const translate = (method: string) => {
      switch(method) {
        case 'COD': return 'Tiền mặt';
        case 'BANK_TRANSFER': return 'Chuyển khoản';
        case 'E_WALLET': return 'Ví điện tử';
        default: return method;
      }
    };
    
    return Array.from(paymentMap).map(([name, value]) => ({ 
      name: translate(name), 
      value 
    }));
  };
  
  return (
    <Box sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Báo cáo & Thống kê</Typography>
        <Box display="flex" alignItems="center">
          <FormControl sx={{ width: 200, mr: 2 }}>
            <InputLabel>Khoảng thời gian</InputLabel>
            <Select
              value={salesFilter.period}
              label="Khoảng thời gian"
              onChange={(e) => handleSalesFilterChange('period', e.target.value)}
            >
              <MenuItem value="week">Tuần này</MenuItem>
              <MenuItem value="month">Tháng này</MenuItem>
              <MenuItem value="quarter">Quý này</MenuItem>
              <MenuItem value="year">Năm nay</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={() => fetchSalesReport()}
          >
            Cập nhật
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Doanh thu" />
          <Tab label="Sản phẩm" />
          <Tab label="Người dùng" />
          <Tab label="Đơn hàng" />
        </Tabs>

        {/* Sales Report */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Doanh thu theo {salesFilter.period === 'week' ? 'tuần' : salesFilter.period === 'month' ? 'tháng' : salesFilter.period === 'quarter' ? 'quý' : 'năm'}</Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('sales')}
            >
              Xuất báo cáo
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Biểu đồ doanh thu</Typography>
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box height={400}>
                      {salesData && salesData.labels && salesData.labels.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={salesData.labels.map((label, index) => ({
                              name: label,
                              revenue: salesData.datasets[0].data[index]
                            }))}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
                            <RechartsTooltip formatter={(value: ValueType) => {
                              if (typeof value === 'number' || typeof value === 'string') {
                                return formatCurrency(value);
                              }
                              return String(value);
                            }} />
                            <Legend />
                            <Bar 
                              dataKey="revenue" 
                              name="Doanh thu" 
                              fill={CHART_COLORS.revenue} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                          <Typography color="textSecondary">Không có dữ liệu</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Thống kê doanh thu</Typography>
                  <Box my={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tổng doanh thu:</Typography>
                      <Typography fontWeight="bold">
                        {salesData?.datasets?.[0]?.data 
                          ? formatCurrency(salesData.datasets[0].data.reduce((a, b) => a + b, 0) || 0)
                          : '0đ'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Doanh thu trung bình/ngày:</Typography>
                      <Typography fontWeight="bold">
                        {salesData?.datasets?.[0]?.data && salesData?.labels?.length > 0
                          ? formatCurrency((salesData.datasets[0].data.reduce((a, b) => a + b, 0) / salesData.labels.length) || 0)
                          : '0đ'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Ngày có doanh thu cao nhất:</Typography>
                      <Typography fontWeight="bold">
                        {salesData?.datasets?.[0]?.data && salesData?.labels
                          ? salesData.labels[salesData.datasets[0].data.indexOf(Math.max(...salesData.datasets[0].data))]
                          : 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Doanh thu cao nhất:</Typography>
                      <Typography fontWeight="bold">
                        {salesData?.datasets?.[0]?.data
                          ? formatCurrency(Math.max(...salesData.datasets[0].data) || 0)
                          : '0đ'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>So sánh với kỳ trước</Typography>
                  <Box my={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tăng trưởng doanh thu:</Typography>
                      <Chip 
                        label={salesData?.revenueGrowth ? `${salesData.revenueGrowth > 0 ? '+' : ''}${salesData.revenueGrowth}%` : "+15.2%"} 
                        color={salesData?.revenueGrowth && salesData.revenueGrowth < 0 ? "error" : "success"}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tăng trưởng đơn hàng:</Typography>
                      <Chip 
                        label={salesData?.orderGrowth ? `${salesData.orderGrowth > 0 ? '+' : ''}${salesData.orderGrowth}%` : "+8.7%"} 
                        color={salesData?.orderGrowth && salesData.orderGrowth < 0 ? "error" : "success"}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Tăng trưởng số lượng khách hàng:</Typography>
                      <Chip 
                        label={salesData?.customerGrowth ? `${salesData.customerGrowth > 0 ? '+' : ''}${salesData.customerGrowth}%` : "+12.3%"} 
                        color={salesData?.customerGrowth && salesData.customerGrowth < 0 ? "error" : "success"}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Products Report */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Thống kê sản phẩm</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl sx={{ width: 200 }}>
                <InputLabel>Sắp xếp theo</InputLabel>
                <Select
                  value={productsFilter.sortBy}
                  label="Sắp xếp theo"
                  onChange={(e) => handleProductsFilterChange('sortBy', e.target.value)}
                  size="small"
                >
                  <MenuItem value="sales">Số lượng bán</MenuItem>
                  <MenuItem value="revenue">Doanh thu</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('products')}
              >
                Xuất báo cáo
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Top 10 sản phẩm bán chạy</Typography>
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Sản phẩm</TableCell>
                            <TableCell align="right">Số lượng bán</TableCell>
                            <TableCell align="right">Doanh thu</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Array.isArray(productsData) && productsData.length > 0 ? (
                            productsData.slice(0, 10).map((product) => (
                              <TableRow key={product.id}>
                                <TableCell>{product.name}</TableCell>
                                <TableCell align="right">{product.quantity}</TableCell>
                                <TableCell align="right">{formatCurrency(product.revenue)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} align="center">Không có dữ liệu</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Phân bố doanh thu theo danh mục</Typography>
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box height={350}>
                      {Array.isArray(productsData) && productsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getCategoryDistribution(productsData)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={130}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getCategoryDistribution(productsData).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: ValueType) => {
                              if (typeof value === 'number' || typeof value === 'string') {
                                return formatCurrency(value);
                              }
                              return String(value);
                            }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                          <Typography color="textSecondary">Không có dữ liệu</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Users Report */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Thống kê người dùng</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl sx={{ width: 200 }}>
                <InputLabel>Sắp xếp theo</InputLabel>
                <Select
                  value={usersFilter.sortBy}
                  label="Sắp xếp theo"
                  onChange={(e) => handleUsersFilterChange('sortBy', e.target.value)}
                  size="small"
                >
                  <MenuItem value="orders">Số đơn hàng</MenuItem>
                  <MenuItem value="spent">Tổng chi tiêu</MenuItem>
                  <MenuItem value="recent">Gần đây nhất</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('users')}
              >
                Xuất báo cáo
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Biểu đồ người dùng mới</Typography>
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box height={350}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { name: 'T1', users: 65 },
                            { name: 'T2', users: 78 },
                            { name: 'T3', users: 90 },
                            { name: 'T4', users: 81 },
                            { name: 'T5', users: 105 },
                            { name: 'T6', users: 120 },
                            { name: 'T7', users: 125 },
                            { name: 'T8', users: 150 },
                            { name: 'T9', users: 142 },
                            { name: 'T10', users: 168 },
                            { name: 'T11', users: 180 },
                            { name: 'T12', users: 220 }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="users" 
                            name="Người dùng mới" 
                            stroke={CHART_COLORS.primary} 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Thống kê người dùng</Typography>
                  <Box my={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tổng số người dùng:</Typography>
                      <Typography fontWeight="bold">1,245</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Người dùng mới trong kỳ:</Typography>
                      <Typography fontWeight="bold">124</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tỷ lệ chuyển đổi:</Typography>
                      <Typography fontWeight="bold">23.5%</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Giá trị trung bình/người dùng:</Typography>
                      <Typography fontWeight="bold">1,245,000đ</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Top 5 khách hàng</Typography>
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Tên</TableCell>
                            <TableCell align="right">Số đơn hàng</TableCell>
                            <TableCell align="right">Tổng chi tiêu</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Array.isArray(usersData) && usersData.length > 0 ? (
                            usersData.slice(0, 5).map((user) => (
                              <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell align="right">{user.orderCount}</TableCell>
                                <TableCell align="right">{formatCurrency(user.totalSpent)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} align="center">Không có dữ liệu</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Orders Report */}
        <TabPanel value={tabValue} index={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Thống kê đơn hàng</Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl sx={{ width: 200 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={ordersFilter.status}
                  label="Trạng thái"
                  onChange={(e) => handleOrdersFilterChange('status', e.target.value)}
                  size="small"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  <MenuItem value="PENDING">Chờ xử lý</MenuItem>
                  <MenuItem value="PROCESSING">Đang xử lý</MenuItem>
                  <MenuItem value="SHIPPED">Đang giao hàng</MenuItem>
                  <MenuItem value="DELIVERED">Đã giao hàng</MenuItem>
                  <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportReport('orders')}
              >
                Xuất báo cáo
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Phân bố trạng thái đơn hàng</Typography>
                  {loading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box height={300}>
                      {ordersData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getOrderStatusDistribution()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getOrderStatusDistribution().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(value: ValueType) => {
                              if (typeof value === 'number' || typeof value === 'string') {
                                return formatCurrency(value);
                              }
                              return String(value);
                            }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                          <Typography color="textSecondary">Không có dữ liệu</Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Thống kê đơn hàng</Typography>
                  <Box my={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tổng số đơn hàng:</Typography>
                      <Typography fontWeight="bold">{ordersData.length}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Giá trị trung bình/đơn hàng:</Typography>
                      <Typography fontWeight="bold">
                        {ordersData.length > 0 
                          ? formatCurrency(ordersData.reduce((sum, order) => sum + (order.total || 0), 0) / ordersData.length) 
                          : '0đ'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tỷ lệ hoàn thành:</Typography>
                      <Typography fontWeight="bold">
                        {ordersData.length > 0 
                          ? (ordersData.filter(order => order.status === 'DELIVERED').length / ordersData.length * 100).toFixed(1) + '%'
                          : '0%'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Tỷ lệ hủy đơn:</Typography>
                      <Typography fontWeight="bold">
                        {ordersData.length > 0 
                          ? (ordersData.filter(order => order.status === 'CANCELLED').length / ordersData.length * 100).toFixed(1) + '%'
                          : '0%'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>Phương thức thanh toán</Typography>
                  <Box my={2} height={150}>
                    {ordersData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getPaymentMethodDistribution()}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <RechartsTooltip formatter={(value: ValueType) => {
                            if (typeof value === 'number' || typeof value === 'string') {
                              return formatCurrency(value);
                            }
                            return String(value);
                          }} />
                          <Bar dataKey="value" name="Số đơn hàng" fill={CHART_COLORS.info} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <Typography color="textSecondary">Không có dữ liệu</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Danh sách đơn hàng gần đây</Typography>
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Mã đơn</TableCell>
                          <TableCell>Ngày đặt</TableCell>
                          <TableCell>Trạng thái</TableCell>
                          <TableCell>Phương thức thanh toán</TableCell>
                          <TableCell align="right">Tổng giá trị</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ordersData.length > 0 ? (
                          ordersData.slice(0, 10).map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>#{order.id}</TableCell>
                              <TableCell>{formatDate(order.date)}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={order.status} 
                                  size="small"
                                  color={
                                    order.status === 'DELIVERED' ? 'success' :
                                    order.status === 'SHIPPED' ? 'info' :
                                    order.status === 'PROCESSING' ? 'primary' :
                                    order.status === 'CANCELLED' ? 'error' : 
                                    'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>{order.paymentMethod}</TableCell>
                              <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">Không có dữ liệu</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminReports; 