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
    return api.put('/notifications/read-all');
  },

  deleteNotification(id: number) {
    return api.delete(`/notifications/${id}`);
  },

  // Các phương thức mới để tạo thông báo cho các sự kiện cụ thể
  
  // Tạo thông báo khi đơn hàng được đặt thành công
  createOrderSuccessNotification: async (orderId: number, totalAmount: number) => {
    return api.post('/notifications/order-success', { orderId, totalAmount });
  },
  
  // Tạo thông báo khi đơn hàng bị hủy
  createOrderCancelledNotification: async (orderId: number, reason: string) => {
    return api.post('/notifications/order-cancelled', { orderId, reason });
  },
  
  // Tạo thông báo khi người dùng nhận được mã giảm giá
  createCouponReceivedNotification: async (couponCode: string, userId: number) => {
    return api.post('/notifications/coupon-received', { couponCode, userId });
  }
};

export default NotificationService; 