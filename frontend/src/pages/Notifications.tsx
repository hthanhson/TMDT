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
  Tooltip,
  Pagination
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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0); // Dùng để refresh sau khi xóa hoặc đánh dấu đã đọc
  const pageSize = 10;

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/notifications' } });
      return;
    }
    
    fetchNotifications();
  }, [user, navigate, page, refreshKey]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await NotificationService.getNotificationsWithPagination(page, pageSize);
      setNotifications(response.data.content);
      setTotalPages(response.data.totalPages || 1);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Không thể tải thông báo');
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
      // Refresh list after marking all as read
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await NotificationService.deleteNotification(id);
      
      // Nếu xóa thông báo cuối cùng trên trang hiện tại và không phải trang đầu tiên thì chuyển về trang trước
      if (notifications.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        // Cập nhật danh sách thông báo trên trang hiện tại
        setRefreshKey(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1); // Material UI Pagination là 1-indexed, API của chúng ta là 0-indexed
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
      case 'ORDER_STATUS_CHANGE':
        return <OrderIcon color="primary" />;
      case 'PROMOTION':
        return <PromotionIcon color="secondary" />;
      case 'SYSTEM':
      case 'SYSTEM_ANNOUNCEMENT':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return dateStr;
    }
  };

  // Hiện loading spinner khi đang tải trang đầu tiên và chưa có thông báo
  if (loading && page === 0 && notifications.length === 0) {
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
          Thông báo
        </Typography>
        
        {notifications.length > 0 && (
          <Button 
            startIcon={<MarkAllReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.isRead)}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {notifications.length === 0 && !loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Bạn không có thông báo nào
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper sx={{ mb: 2 }}>
            <List>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      backgroundColor: notification.isRead ? 'inherit' : 'action.hover',
                      transition: 'background-color 0.3s'
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
                              label="Mới" 
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
                        <Tooltip title="Đánh dấu đã đọc">
                          <IconButton 
                            edge="end" 
                            aria-label="mark as read"
                            onClick={() => handleMarkAsRead(notification.id)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <ReadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Xóa">
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleDeleteNotification(notification.id)}
                          size="small"
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
          
          {/* Pagination component */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination 
                count={totalPages} 
                page={page + 1} 
                onChange={handlePageChange} 
                color="primary" 
                showFirstButton 
                showLastButton
                disabled={loading}
              />
            </Box>
          )}

          {/* Loading indicator khi chuyển trang */}
          {loading && notifications.length > 0 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={30} />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default Notifications;