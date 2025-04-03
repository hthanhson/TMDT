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
  Divider
} from '@mui/material';
import { 
  DownloadOutlined as DownloadIcon,
  BarChart as ChartIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingBag as OrdersIcon,
  People as UsersIcon 
} from '@mui/icons-material';
import AdminService from '../../services/AdminService';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { toast } from 'react-toastify';

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
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
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
  const [salesData, setSalesData] = useState<any[]>([]);
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
      setSalesData(response.data || []);
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
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Sales Report" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="Products Report" icon={<ChartIcon />} iconPosition="start" />
          <Tab label="Users Report" icon={<UsersIcon />} iconPosition="start" />
          <Tab label="Orders Report" icon={<OrdersIcon />} iconPosition="start" />
        </Tabs>
        
        {/* Sales Report Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Revenue
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    ${summaryData.totalSales.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Orders
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {summaryData.totalOrders}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Customers
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {summaryData.totalCustomers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Average Order Value
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    ${summaryData.averageOrderValue.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={salesFilter.period}
                    label="Period"
                    onChange={(e) => handleSalesFilterChange('period', e.target.value)}
                  >
                    <MenuItem value="day">Daily</MenuItem>
                    <MenuItem value="week">Weekly</MenuItem>
                    <MenuItem value="month">Monthly</MenuItem>
                    <MenuItem value="year">Yearly</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {salesFilter.period === 'custom' && (
                <>
                  <Grid item xs={12} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={salesFilter.startDate}
                        onChange={(newValue) => newValue && handleSalesFilterChange('startDate', newValue)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={salesFilter.endDate}
                        onChange={(newValue) => newValue && handleSalesFilterChange('endDate', newValue)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        minDate={salesFilter.startDate}
                      />
                    </LocalizationProvider>
                  </Grid>
                </>
              )}
              
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => fetchSalesReport()}
                  disabled={loading}
                  fullWidth
                >
                  Apply Filter
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportReport('sales')}
                  disabled={loading}
                  fullWidth
                >
                  Export Report
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Avg. Order Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : salesData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  salesData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.period}</TableCell>
                      <TableCell>{item.orderCount}</TableCell>
                      <TableCell>${parseFloat(item.revenue).toFixed(2)}</TableCell>
                      <TableCell>${parseFloat(item.averageOrderValue).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Products Report Tab */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={productsFilter.period}
                    label="Period"
                    onChange={(e) => handleProductsFilterChange('period', e.target.value)}
                  >
                    <MenuItem value="week">Last Week</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={productsFilter.category}
                    label="Category"
                    onChange={(e) => handleProductsFilterChange('category', e.target.value)}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="electronics">Electronics</MenuItem>
                    <MenuItem value="clothing">Clothing</MenuItem>
                    <MenuItem value="home">Home & Kitchen</MenuItem>
                    <MenuItem value="books">Books</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={productsFilter.sortBy}
                    label="Sort By"
                    onChange={(e) => handleProductsFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="sales">Sales</MenuItem>
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="views">Views</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportReport('products')}
                  disabled={loading}
                  fullWidth
                >
                  Export Report
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Sales</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Conversion Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : productsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  productsData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.sales}</TableCell>
                      <TableCell>${parseFloat(item.revenue).toFixed(2)}</TableCell>
                      <TableCell>{item.views}</TableCell>
                      <TableCell>{(item.conversionRate * 100).toFixed(2)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Users Report Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={usersFilter.period}
                    label="Period"
                    onChange={(e) => handleUsersFilterChange('period', e.target.value)}
                  >
                    <MenuItem value="week">Last Week</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={usersFilter.sortBy}
                    label="Sort By"
                    onChange={(e) => handleUsersFilterChange('sortBy', e.target.value)}
                  >
                    <MenuItem value="orders">Orders</MenuItem>
                    <MenuItem value="spending">Spending</MenuItem>
                    <MenuItem value="lastActive">Last Active</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportReport('users')}
                  disabled={loading}
                  fullWidth
                >
                  Export Report
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Registration Date</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Total Spending</TableCell>
                  <TableCell>Last Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : usersData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  usersData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.username}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>{new Date(item.registrationDate).toLocaleDateString()}</TableCell>
                      <TableCell>{item.orderCount}</TableCell>
                      <TableCell>${parseFloat(item.totalSpending).toFixed(2)}</TableCell>
                      <TableCell>{new Date(item.lastActive).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* Orders Report Tab */}
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={ordersFilter.period}
                    label="Period"
                    onChange={(e) => handleOrdersFilterChange('period', e.target.value)}
                  >
                    <MenuItem value="week">Last Week</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={ordersFilter.status}
                    label="Status"
                    onChange={(e) => handleOrdersFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PROCESSING">Processing</MenuItem>
                    <MenuItem value="SHIPPED">Shipped</MenuItem>
                    <MenuItem value="DELIVERED">Delivered</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleExportReport('orders')}
                  disabled={loading}
                  fullWidth
                >
                  Export Report
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Orders</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell>Avg. Items</TableCell>
                  <TableCell>Avg. Order Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : ordersData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  ordersData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.period}</TableCell>
                      <TableCell>{item.status || 'All'}</TableCell>
                      <TableCell>{item.orderCount}</TableCell>
                      <TableCell>${parseFloat(item.revenue).toFixed(2)}</TableCell>
                      <TableCell>{parseFloat(item.averageItems).toFixed(2)}</TableCell>
                      <TableCell>${parseFloat(item.averageOrderValue).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminReports; 