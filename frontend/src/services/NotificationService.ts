import api from './api';
import { Notification } from '../types/notification';

// Dịch vụ thông báo kết nối với backend
const NotificationService = {
  getNotifications: async () => {
    return api.get<Notification[]>('/notifications');
  },

  getUnreadCount: async () => {
    return api.get<number>('/notifications/unread-count');
  },

  markAsRead: async (notificationId: number) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    return api.put('/notifications/mark-all-read');
  },

  deleteNotification(id: number) {
    return api.delete(`/notifications/${id}`);
  }
};

export default NotificationService; 