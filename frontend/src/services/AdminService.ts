import api from './api';
import { API_URL } from '../config';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  enabled: boolean;
  coupons: string[];
  createdAt: string;
}

interface Order {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: any[];
}

interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

class AdminService {
  // Dashboard
  async getDashboardSummary() {
    try {
      console.log('Fetching admin dashboard summary');
      const response = await api.get('/admin/dashboard');
      console.log('Admin dashboard response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin dashboard:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      return await api.get('/admin/dashboard/stats');
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error.message);
      throw error;
    }
  }

  async getSalesData(period: string = 'week') {
    try {
      return await api.get('/admin/dashboard/sales', { params: { period } });
    } catch (error: any) {
      console.error('Error fetching sales data:', error.message);
      throw error;
    }
  }

  async getTopProducts(limit: number = 5) {
    try {
      return await api.get('/admin/dashboard/top-products', { params: { limit } });
    } catch (error: any) {
      console.error('Error fetching top products:', error.message);
      throw error;
    }
  }

  async getRecentOrders(limit: number = 5) {
    try {
      return await api.get('/admin/dashboard/recent-orders', { params: { limit } });
    } catch (error: any) {
      console.error('Error fetching recent orders:', error.message);
      throw error;
    }
  }

  // Users
  async getAllUsers(params?: any) {
    try {
      console.log('Fetching all users for admin');
      const response = await api.get('/admin/users', { params });
      console.log('Admin users response:', response.data);
      return { data: response.data };
    } catch (error: any) {
      console.error('Error fetching admin users:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  async getUser(id: string) {
    try {
      return await api.get<User>(`/admin/users/${id}`);
    } catch (error: any) {
      console.error(`Error fetching user ${id}:`, error.message);
      throw error;
    }
  }

  async updateUser(id: string, userData: any) {
    try {
      return await api.put(`/admin/users/${id}`, userData);
    } catch (error: any) {
      console.error(`Error updating user ${id}:`, error.message);
      throw error;
    }
  }

  async deleteUser(id: string) {
    try {
      return await api.delete(`/admin/users/${id}`);
    } catch (error: any) {
      console.error(`Error deleting user ${id}:`, error.message);
      throw error;
    }
  }

  async updateUserStatus(id: string, enabled: boolean) {
    try {
      return await api.put(`/admin/users/${id}/status`, { enabled });
    } catch (error: any) {
      console.error(`Error updating user ${id} status:`, error.message);
      throw error;
    }
  }

  async assignCouponToUser(userId: string | number, couponCode: string) {
    try {
      console.log(`Assigning coupon ${couponCode} to user ${userId}`);
      const response = await api.put(`/admin/users/${userId}/coupons`, { couponCode });
      console.log('Assign coupon response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error assigning coupon:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  // Products
  async getAllProducts(params?: any) {
    try {
      console.log('Fetching all products for admin');
      const response = await api.get('/admin/products', { params });
      console.log('Admin products response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin products:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  async getProduct(id: string) {
    try {
      return await api.get<Product>(`/admin/products/${id}`);
    } catch (error: any) {
      console.error(`Error fetching product ${id}:`, error.message);
      throw error;
    }
  }

  async createProduct(productData: FormData) {
    try {
      return await api.post('/admin/products', productData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error: any) {
      console.error('Error creating product:', error.message);
      throw error;
    }
  }

  async updateProduct(id: string, productData: FormData) {
    try {
      return await api.put(`/admin/products/${id}`, productData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error: any) {
      console.error(`Error updating product ${id}:`, error.message);
      throw error;
    }
  }

  async deleteProduct(id: string | number) {
    try {
      console.log(`Deleting product ${id}`);
      const response = await api.delete(`/admin/products/${id}`);
      console.log('Delete product response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting product:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  // Categories
  async getAllCategories(params?: any) {
    try {
      return await api.get<string[]>('/categories', { params });
    } catch (error: any) {
      console.error('Error fetching categories:', error.message);
      throw error;
    }
  }

  async getCategories(params?: any) {
    try {
      return await api.get<string[]>('/categories', { params });
    } catch (error: any) {
      console.error('Error fetching categories:', error.message);
      throw error;
    }
  }

  async getCategory(id: string) {
    try {
      return await api.get<Category>(`/admin/categories/${id}`);
    } catch (error: any) {
      console.error(`Error fetching category ${id}:`, error.message);
      throw error;
    }
  }

  async createCategory(categoryData: any) {
    try {
      return await api.post('/admin/categories', categoryData);
    } catch (error: any) {
      console.error('Error creating category:', error.message);
      throw error;
    }
  }

  async updateCategory(id: string, categoryData: any) {
    try {
      return await api.put(`/admin/categories/${id}`, categoryData);
    } catch (error: any) {
      console.error(`Error updating category ${id}:`, error.message);
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      return await api.delete(`/admin/categories/${id}`);
    } catch (error: any) {
      console.error(`Error deleting category ${id}:`, error.message);
      throw error;
    }
  }

  // Orders
  async getAllOrders(params?: any) {
    try {
      console.log('Fetching all orders for admin');
      const response = await api.get('/orders', { params });
      console.log('Admin orders response:', response);
      
      if (response.data) {
        // Nếu là mảng
        if (Array.isArray(response.data)) {
          response.data = response.data.map(this.normalizeOrderData.bind(this));
        } 
        // Nếu là đối tượng pagination
        else if (response.data.content && Array.isArray(response.data.content)) {
          response.data.content = response.data.content.map(this.normalizeOrderData.bind(this));
        }
        // Nếu là một đơn hàng
        else if (response.data.id) {
          response.data = this.normalizeOrderData(response.data);
        }
      }
      
      return response;
    } catch (error: any) {
      console.error('Error fetching admin orders:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  async getOrder(id: string) {
    try {
      const response = await api.get<Order>(`/orders/${id}`);
      if (response.data) {
        response.data = this.normalizeOrderData(response.data);
      }
      return response;
    } catch (error: any) {
      console.error(`Error fetching order ${id}:`, error.message);
      throw error;
    }
  }

  async updateOrderStatus(id: string | number, status: string) {
    try {
      console.log(`Updating order ${id} status to ${status}`);
      const response = await api.put(`/orders/${id}/status?status=${status}`);
      console.log('Update order status response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error updating order status:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  // Phương thức lấy thông tin về trạng thái hoàn tiền
  async getRefundStatus(orderId: string | number) {
    try {
      console.log(`Fetching refund status for order ${orderId}`);
      const response = await api.get(`/orders/${orderId}/refund-status`);
      console.log('Refund status response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching refund status:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }
  
  // Phương thức cập nhật trạng thái yêu cầu hoàn tiền
  async updateRefundStatus(orderId: string | number, status: string, adminNotes?: string) {
    try {
      console.log(`Updating refund request for order ${orderId} to ${status}`);
      
      // Đầu tiên, lấy refund request ID từ orderId
      const refundResponse = await this.getRefundStatus(orderId);
      
      if (!refundResponse || !refundResponse.data || !refundResponse.data.id) {
        throw new Error('Refund request not found for this order');
      }
      
      const refundId = refundResponse.data.id;
      
      // Tạo query params
      let params: any = { status };
      if (adminNotes) {
        params.adminNotes = adminNotes;
      }
      
      // Sử dụng endpoint trực tiếp với ID của refund request
      const response = await api.put(`/refunds/${refundId}/status`, null, { params });
      console.log('Update refund status response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error updating refund status:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }
  
  // Lấy danh sách tất cả các yêu cầu hoàn tiền
  async getAllRefundRequests(params?: any) {
    try {
      console.log('Fetching all refund requests');
      const response = await api.get('/refunds/all', { params });
      console.log('Admin refunds response:', response);
      return response;
    } catch (error: any) {
      console.error('Error fetching refund requests:', error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }

  // Reviews
  async getAllReviews(params?: any) {
    return api.get('/admin/reviews', { params });
  }

  async getReview(id: string) {
    return api.get(`/admin/reviews/${id}`);
  }

  async updateReviewStatus(id: string, status: string) {
    return api.put(`/admin/reviews/${id}/status`, { status });
  }

  async deleteReview(id: string) {
    return api.delete(`/admin/reviews/${id}`);
  }

  // Notifications
  async getAllNotifications(params?: any) {
    return api.get('/admin/notifications', { params });
  }

  async createNotification(notificationData: any) {
    return api.post('/admin/notifications', notificationData);
  }

  async updateNotification(id: string, notificationData: any) {
    return api.put(`/admin/notifications/${id}`, notificationData);
  }

  async deleteNotification(id: string) {
    return api.delete(`/admin/notifications/${id}`);
  }

  // Coupons
  async getActiveCoupons() {
    return api.get('/coupons/active');
  }

  // Reports
  async getSalesReport(params?: any) {
    return api.get('/admin/reports/sales', { params });
  }

  async getProductsReport(params?: any) {
    return api.get('/admin/reports/products', { params });
  }

  async getUsersReport(params?: any) {
    return api.get('/admin/reports/users', { params });
  }

  async getOrdersReport(params?: any) {
    return api.get('/admin/reports/orders', { params });
  }

  async exportReport(reportType: string, params?: any) {
    return api.get(`/api/admin/reports/export/${reportType}`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // Phương thức chuẩn hóa đơn hàng để đảm bảo cấu trúc nhất quán
  private normalizeOrderData(order: any): any {
    if (!order) return null;
    
    const normalizedOrder = { ...order };
    
    // Chuẩn hóa trường user
    if (typeof normalizedOrder.user === 'number' || typeof normalizedOrder.user === 'string') {
      normalizedOrder.userId = normalizedOrder.user;
      normalizedOrder.user = { id: normalizedOrder.user };
    }
    
    // Đảm bảo user là một object
    if (!normalizedOrder.user || typeof normalizedOrder.user !== 'object') {
      normalizedOrder.user = {};
    }
    
    // Gán tên người dùng ưu tiên từ recipientName hoặc các trường khác
    if (normalizedOrder.recipientName) {
      normalizedOrder.user.displayName = normalizedOrder.recipientName;
    } else if (normalizedOrder.user.username) {
      normalizedOrder.user.displayName = normalizedOrder.user.username;
    } else if (normalizedOrder.user.fullName) {
      normalizedOrder.user.displayName = normalizedOrder.user.fullName;
    } else if (normalizedOrder.username) {
      normalizedOrder.user.displayName = normalizedOrder.username;
    } else {
      normalizedOrder.user.displayName = `Khách hàng #${normalizedOrder.userId || normalizedOrder.user.id || 'Unknown'}`;
    }
    
    return normalizedOrder;
  }
  
  // Phương thức lấy một đơn hàng theo ID
  async getOrderById(orderId: string) {
    try {
      console.log(`Fetching order by ID: ${orderId}`);
      const response = await api.get(`/orders/${orderId}`);
      console.log('Get order by ID response:', response);
      
      if (response.data) {
        response.data = this.normalizeOrderData(response.data);
      }
      
      return response;
    } catch (error: any) {
      console.error(`Error fetching order ${orderId}:`, error.message);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  }
}

export default new AdminService();