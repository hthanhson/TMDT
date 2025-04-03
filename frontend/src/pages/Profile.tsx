import React, { useState } from 'react';
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
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

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
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    address: user?.address || '',
    phoneNumber: user?.phoneNumber || '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Call API to update profile
      // Example: await userService.updateProfile(profileData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="h5">Please log in to view your profile</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ my: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
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
            <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
              Member since {new Date().getFullYear()}
            </Typography>
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
              <Tab label="Profile Information" />
              <Tab label="Orders" />
              <Tab label="Wishlist" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
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
                      label="Address"
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
                      label="Phone Number"
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
                      {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Your Orders</Typography>
                <Typography variant="body2" color="textSecondary">
                  View your order history here
                </Typography>
                {/* Order history would be rendered here */}
                <Card sx={{ mt: 2, mb: 1 }}>
                  <CardContent>
                    <Typography>No orders yet</Typography>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Your Wishlist</Typography>
                <Typography variant="body2" color="textSecondary">
                  Products you've saved for later
                </Typography>
                {/* Wishlist would be rendered here */}
                <Card sx={{ mt: 2, mb: 1 }}>
                  <CardContent>
                    <Typography>Your wishlist is empty</Typography>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 