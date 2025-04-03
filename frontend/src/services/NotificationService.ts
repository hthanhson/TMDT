import api from './api';
import { Notification } from '../types/notification';

// Dữ liệu mẫu cho thông báo
const demoNotifications: Notification[] = [
  {
    id: 1,
    userId: 1,
    message: 'Đơn hàng #12345 của bạn đã được xác nhận',
    type: 'ORDER',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    additionalData: { orderId: '12345' }
  },
  {
    id: 2,
    userId: 1,
    message: 'Giảm giá 20% cho sản phẩm điện tử trong tuần này',
    type: 'PROMOTION',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    additionalData: { promotionId: 'SUMMER20' }
  },
  {
    id: 3,
    userId: 1,
    message: 'Chào mừng bạn đến với TMDT Shop',
    type: 'SYSTEM',
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    userId: 1,
    message: 'Đơn hàng #12346 của bạn đã được giao',
    type: 'ORDER',
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    additionalData: { orderId: '12346' }
  }
];

// Service thật sẽ gọi API, service demo sẽ trả về dữ liệu mẫu
const NotificationService = {
  getNotifications: async () => {
    // Trong môi trường sản phẩm thật, sẽ gọi API
    // return api.get<Notification[]>('/notifications');
    
    // Demo: trả về dữ liệu mẫu sau một khoảng thời gian ngắn
    return new Promise<{ data: Notification[] }>((resolve) => {
      setTimeout(() => {
        resolve({ data: demoNotifications });
      }, 500);
    });
  },

  getUnreadCount: async () => {
    // Trong môi trường sản phẩm thật, sẽ gọi API
    // return api.get<number>('/notifications/unread-count');
    
    // Demo: đếm số thông báo chưa đọc
    return new Promise<{ data: number }>((resolve) => {
      setTimeout(() => {
        const unreadCount = demoNotifications.filter(n => !n.isRead).length;
        resolve({ data: unreadCount });
      }, 300);
    });
  },

  markAsRead: async (notificationId: number) => {
    // Trong môi trường sản phẩm thật, sẽ gọi API
    // return api.put(`/notifications/${notificationId}/read`);
    
    // Demo: đánh dấu thông báo đã đọc
    return new Promise<{ data: any }>((resolve) => {
      setTimeout(() => {
        const notification = demoNotifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
        resolve({ data: notification });
      }, 300);
    });
  },

  markAllAsRead: async () => {
    // Trong môi trường sản phẩm thật, sẽ gọi API
    // return api.put('/notifications/mark-all-read');
    
    // Demo: đánh dấu tất cả thông báo đã đọc
    return new Promise<{ data: any }>((resolve) => {
      setTimeout(() => {
        demoNotifications.forEach(n => {
          n.isRead = true;
        });
        resolve({ data: { success: true } });
      }, 300);
    });
  },

  deleteNotification(id: number) {
    return api.delete(`/notifications/${id}`);
  }
};

export default NotificationService; 