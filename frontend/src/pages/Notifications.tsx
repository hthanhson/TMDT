import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ShoppingBag as OrderIcon,
  Info as InfoIcon,
  LocalOffer as PromotionIcon,
  CheckCircle as ReadIcon,
  Delete as DeleteIcon,
  MarkChatRead as MarkAllReadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import NotificationService from '../services/NotificationService';
import { Notification } from '../types/notification';
import { useAuth } from '../contexts/AuthContext';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/notifications' } });
      return;
    }
    
    fetchNotifications();
  }, [user, navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getNotifications();
      setNotifications(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true } 
          : notification
      ));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(notifications.map(notification => 
        ({ ...notification, isRead: true })
      ));
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await NotificationService.deleteNotification(id);
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (err: any) {
      console.error('Error deleting notification:', err);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ORDER':
        return <OrderIcon color="primary" />;
      case 'PROMOTION':
        return <PromotionIcon color="secondary" />;
      case 'SYSTEM':
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy, HH:mm');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Notifications
        </Typography>
        
        {notifications.length > 0 && (
          <Button 
            startIcon={<MarkAllReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.isRead)}
          >
            Mark All as Read
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            You have no notifications
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    backgroundColor: notification.isRead ? 'inherit' : 'action.hover',
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography
                          component="span"
                          variant="body1"
                          sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                        >
                          {notification.message}
                        </Typography>
                        {!notification.isRead && (
                          <Chip 
                            label="New" 
                            color="primary" 
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {formatDate(notification.createdAt)}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!notification.isRead && (
                      <Tooltip title="Mark as read">
                        <IconButton 
                          edge="end" 
                          aria-label="mark as read"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <ReadIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default Notifications; 