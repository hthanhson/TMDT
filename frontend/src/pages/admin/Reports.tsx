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

interface ReportData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
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
      setSalesData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching sales report:', err);
      setError(err.response?.data?.message || 'Failed to fetch sales report');
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
      setProductsData(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching products report:', err);
      setError(err.response?.data?.message || 'Failed to fetch products report');
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
      setUsersData(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching users report:', err);
      setError(err.response?.data?.message || 'Failed to fetch users report');
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
      setOrdersData(response.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders report:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders report');
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
                    <Box height={400} display="flex" justifyContent="center" alignItems="center">
                      {salesData ? (
                        <Typography>Biểu đồ sẽ được hiển thị ở đây</Typography>
                      ) : (
                        <Typography color="textSecondary">Không có dữ liệu</Typography>
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
                        {salesData?.datasets?.[0]?.data?.reduce((a, b) => a + b, 0)?.toLocaleString('vi-VN') || '0'}đ
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Doanh thu trung bình/ngày:</Typography>
                      <Typography fontWeight="bold">
                        {salesData?.datasets?.[0]?.data && salesData?.labels?.length > 0
                          ? (salesData.datasets[0].data.reduce((a, b) => a + b, 0) / salesData.labels.length).toLocaleString('vi-VN')
                          : '0'}đ
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
                          ? Math.max(...salesData.datasets[0].data).toLocaleString('vi-VN')
                          : '0'}đ
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
                        label="+15.2%" 
                        color="success"
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tăng trưởng đơn hàng:</Typography>
                      <Chip 
                        label="+8.7%" 
                        color="success"
                        size="small"
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Tăng trưởng số lượng khách hàng:</Typography>
                      <Chip 
                        label="+12.3%" 
                        color="success"
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
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('products')}
            >
              Xuất báo cáo
            </Button>
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
                    <TableContainer>
                      <Table size="small">
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
                                <TableCell align="right">{product.revenue.toLocaleString('vi-VN')}đ</TableCell>
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
                    <Box height={300} display="flex" justifyContent="center" alignItems="center">
                      <Typography>Biểu đồ tròn phân bố sẽ được hiển thị ở đây</Typography>
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
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('users')}
            >
              Xuất báo cáo
            </Button>
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
                    <Box height={300} display="flex" justifyContent="center" alignItems="center">
                      <Typography>Biểu đồ người dùng mới theo thời gian sẽ được hiển thị ở đây</Typography>
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
                    <TableContainer>
                      <Table size="small">
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
                                <TableCell align="right">{user.totalSpent.toLocaleString('vi-VN')}đ</TableCell>
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
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('orders')}
            >
              Xuất báo cáo
            </Button>
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
                    <Box height={300} display="flex" justifyContent="center" alignItems="center">
                      <Typography>Biểu đồ phân bố sẽ được hiển thị ở đây</Typography>
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
                      <Typography fontWeight="bold">356</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Giá trị trung bình/đơn hàng:</Typography>
                      <Typography fontWeight="bold">645,000đ</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Tỷ lệ hoàn thành:</Typography>
                      <Typography fontWeight="bold">92.4%</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Tỷ lệ hủy đơn:</Typography>
                      <Typography fontWeight="bold">3.2%</Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>Phương thức thanh toán</Typography>
                  <Box my={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Thanh toán khi nhận hàng:</Typography>
                      <Typography>65.2%</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography>Chuyển khoản ngân hàng:</Typography>
                      <Typography>25.7%</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Ví điện tử:</Typography>
                      <Typography>9.1%</Typography>
                    </Box>
                  </Box>
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