import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  Avatar,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  InputAdornment
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import UserService from '../services/UserService';
import { formatCurrency, formatDate } from '../utils/formatters';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    address: user?.address || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [userBalance, setUserBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleDepositAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setDepositAmount(value);
    }
  };

  const openDepositDialog = () => {
    setDepositDialogOpen(true);
    setDepositError(null);
  };

  const closeDepositDialog = () => {
    setDepositDialogOpen(false);
    setDepositAmount('');
    setDepositError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await UserService.updateProfile(profileData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError('Please enter a valid amount');
      return;
    }

    setDepositLoading(true);
    setDepositError(null);

    try {
      const response = await UserService.deposit({
        amount: depositAmount,
        description: 'Manual deposit'
      });
      
      setUserBalance(response.data.balance);
      closeDepositDialog();
      fetchUserBalance(); // Refresh balance
      fetchTransactionHistory(); // Refresh transaction history
    } catch (error: any) {
      console.error('Error making deposit:', error);
      setDepositError(error.response?.data?.message || 'Failed to process deposit');
    } finally {
      setDepositLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserBalance();
    }
  }, [user]);

  useEffect(() => {
    if (tabValue === 1) {
      fetchTransactionHistory();
    }
  }, [tabValue]);

  const fetchUserBalance = async () => {
    setBalanceLoading(true);
    try {
      const response = await UserService.getBalance();
      setUserBalance(response.data.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    setTransactionsLoading(true);
    try {
      const response = await UserService.getTransactionHistory();
      setTransactions(response.data.content || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="h5">Please log in to view your profile</Typography>
      </Box>
    );
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'success.main';
      case 'ORDER_PAYMENT':
        return 'error.main';
      case 'REFUND':
        return 'info.main';
      default:
        return 'text.primary';
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'Nạp tiền';
      case 'WITHDRAWAL':
        return 'Rút tiền';
      case 'ORDER_PAYMENT':
        return 'Thanh toán đơn hàng';
      case 'REFUND':
        return 'Hoàn tiền';
      case 'BONUS':
        return 'Tiền thưởng';
      case 'SYSTEM_ADJUSTMENT':
        return 'Điều chỉnh hệ thống';
      default:
        return type;
    }
  };

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Thông tin tài khoản
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              alt={user.fullName || user.username}
              src="/avatar-placeholder.png"
            />
            <Typography variant="h6">{user.fullName || user.username}</Typography>
            <Typography color="textSecondary" variant="body2">
              {user.email}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1">Số dư tài khoản</Typography>
              {balanceLoading ? (
                <CircularProgress size={24} sx={{ my: 1 }} />
              ) : (
                <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
                  {formatCurrency(userBalance)}
                </Typography>
              )}
              <Button 
                variant="contained" 
                color="primary" 
                onClick={openDepositDialog}
                fullWidth
                sx={{ mt: 1 }}
              >
                Nạp tiền
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Thông tin cá nhân" />
              <Tab label="Lịch sử giao dịch" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ tên"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={profileData.email}
                      InputProps={{ readOnly: true }}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Địa chỉ"
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      name="phoneNumber"
                      value={profileData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Cập nhật thông tin'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Lịch sử giao dịch
              </Typography>
              
              {transactionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : transactions.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ngày</TableCell>
                        <TableCell>Loại giao dịch</TableCell>
                        <TableCell>Mô tả</TableCell>
                        <TableCell align="right">Số tiền</TableCell>
                        <TableCell align="right">Số dư</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                          <TableCell>
                            <Typography color={getTransactionTypeColor(transaction.type)}>
                              {formatTransactionType(transaction.type)}
                            </Typography>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell align="right">
                            <Typography
                              color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                            >
                              {transaction.amount >= 0 ? '+' : ''}
                              {formatCurrency(transaction.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(transaction.balanceAfter)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1">Chưa có giao dịch nào</Typography>
                </Box>
              )}
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onClose={closeDepositDialog}>
        <DialogTitle>Nạp tiền vào tài khoản</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Nhập số tiền bạn muốn nạp vào tài khoản.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Số tiền"
            type="text"
            fullWidth
            value={depositAmount}
            onChange={handleDepositAmountChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            error={!!depositError}
            helperText={depositError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDepositDialog} color="primary">
            Hủy
          </Button>
          <Button 
            onClick={handleDeposit} 
            color="primary"
            disabled={depositLoading || !depositAmount}
            variant="contained"
          >
            {depositLoading ? <CircularProgress size={24} /> : 'Nạp tiền'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;