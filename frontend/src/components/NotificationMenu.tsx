import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  IconButton,
  Divider,
  Badge,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  ShoppingBag as ShoppingBagIcon,
  Info as InfoIcon,
  LocalOffer as OfferIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import NotificationService from '../services/NotificationService';
import { Notification } from '../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface NotificationMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onNotificationsUpdate?: () => void;
}

const NotificationMenu: React.FC<NotificationMenuProps> = ({ anchorEl, open, onClose, onNotificationsUpdate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Chỉ tải thông báo khi menu mở
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Lấy 5 thông báo gần nhất
      const response = await NotificationService.getRecentNotifications(5);
      // Thông báo được sắp xếp từ server, nhưng để đảm bảo, vẫn sắp xếp lại ở client
      const sortedNotifications = response.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sortedNotifications);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Đánh dấu thông báo đã đọc
      if (!notification.isRead) {
        await NotificationService.markAsRead(notification.id);
        // Notify parent to refresh notifications
        if (onNotificationsUpdate) {
          onNotificationsUpdate();
        }
      }

      // Chuyển hướng dựa trên loại thông báo
      if (notification.type === 'ORDER' || notification.type === 'ORDER_STATUS_CHANGE') {
        navigate(`/orders/${notification.additionalData?.orderId || ''}`);
      } else if (notification.type === 'PROMOTION') {
        navigate(`/products?promotion=${notification.additionalData?.promotionId || ''}`);
      } else {
        // Thông báo hệ thống hoặc loại khác
        navigate('/notifications');
      }

      onClose();
    } catch (err) {
      console.error('Error processing notification:', err);
    }
  };

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER':
      case 'ORDER_STATUS_CHANGE':
        return <ShoppingBagIcon color="primary" />;
      case 'PROMOTION':
        return <OfferIcon color="secondary" />;
      case 'SYSTEM':
      case 'SYSTEM_ANNOUNCEMENT':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Hiển thị thời gian tương đối
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
    } catch (e) {
      return 'mới đây';
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          width: 320,
          maxHeight: 400,
          '&:before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: 'background.paper',
            transform: 'translateY(-50%) rotate(45deg)',
            zIndex: 0,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Thông báo</Typography>
        {notifications.length > 0 && (
          <Button 
            color="primary" 
            size="small" 
            onClick={() => {
              NotificationService.markAllAsRead()
                .then(() => {
                  fetchNotifications();
                  // Notify parent component to refresh notifications
                  if (onNotificationsUpdate) {
                    onNotificationsUpdate();
                  }
                });
            }}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </Box>
      
      <Divider />
      
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress size={30} />
        </Box>
      ) : error ? (
        <Box p={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : notifications.length === 0 ? (
        <Box p={3} textAlign="center">
          <NotificationsIcon color="disabled" sx={{ fontSize: 60, opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">Không có thông báo mới</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
          {notifications.map((notification) => (
            <ListItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              button
              alignItems="flex-start"
              sx={{
                borderBottom: '1px solid #eee',
                bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: notification.isRead ? 'grey.300' : 'primary.light' }}>
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Typography variant="body1" noWrap>{notification.message}</Typography>}
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(notification.createdAt)}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      
      <Divider />
      <Box p={1}>
        <Button fullWidth onClick={handleViewAll}>
          Xem tất cả
        </Button>
      </Box>
    </Menu>
  );
};

export default NotificationMenu;