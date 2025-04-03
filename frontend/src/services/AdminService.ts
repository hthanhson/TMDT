import api from './api';

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
  createdAt: string;
}

interface Order {
  id: string;
  userId: string;
  username: string;
  total: number;
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

const AdminService = {
  // Products
  getAllProducts(params?: any) {
    return api.get<Page<Product>>('/admin/products', { params });
  },

  getProduct(id: string) {
    return api.get<Product>(`/admin/products/${id}`);
  },

  createProduct(productData: FormData) {
    return api.post('/admin/products', productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  updateProduct(id: string, productData: FormData) {
    return api.put(`/admin/products/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  deleteProduct(id: string) {
    return api.delete(`/admin/products/${id}`);
  },

  // Categories
  getAllCategories(params?: any) {
    return api.get<string[]>('/categories', { params });
  },

  getCategories(params?: any) {
    return api.get<string[]>('/categories', { params });
  },

  getCategory(id: string) {
    return api.get<Category>(`/admin/categories/${id}`);
  },

  createCategory(categoryData: any) {
    return api.post('/admin/categories', categoryData);
  },

  updateCategory(id: string, categoryData: any) {
    return api.put(`/admin/categories/${id}`, categoryData);
  },

  deleteCategory(id: string) {
    return api.delete(`/admin/categories/${id}`);
  },

  // Users
  getAllUsers(params?: any) {
    return api.get<Page<User>>('/admin/users', { params });
  },

  getUser(id: string) {
    return api.get<User>(`/admin/users/${id}`);
  },

  updateUser(id: string, userData: any) {
    return api.put(`/admin/users/${id}`, userData);
  },

  deleteUser(id: string) {
    return api.delete(`/admin/users/${id}`);
  },

  // Orders
  getAllOrders(params?: any) {
    return api.get<Page<Order>>('/admin/orders', { params });
  },

  getOrder(id: string) {
    return api.get<Order>(`/admin/orders/${id}`);
  },

  updateOrderStatus(id: string, status: string) {
    return api.put(`/admin/orders/${id}/status`, { status });
  },

  // Dashboard statistics
  getDashboardStats() {
    return api.get('/admin/dashboard/stats');
  },

  getSalesData(period: string = 'week') {
    return api.get('/admin/dashboard/sales', { params: { period } });
  },

  getTopProducts(limit: number = 5) {
    return api.get('/admin/dashboard/top-products', { params: { limit } });
  },

  getRecentOrders(limit: number = 5) {
    return api.get('/admin/dashboard/recent-orders', { params: { limit } });
  },

  // Reviews
  getAllReviews(params?: any) {
    return api.get('/admin/reviews', { params });
  },

  getReview(id: string) {
    return api.get(`/admin/reviews/${id}`);
  },

  updateReviewStatus(id: string, status: string) {
    return api.put(`/admin/reviews/${id}/status`, { status });
  },

  deleteReview(id: string) {
    return api.delete(`/admin/reviews/${id}`);
  },

  // Notifications
  getAllNotifications(params?: any) {
    return api.get('/admin/notifications', { params });
  },

  createNotification(notificationData: any) {
    return api.post('/admin/notifications', notificationData);
  },

  updateNotification(id: string, notificationData: any) {
    return api.put(`/admin/notifications/${id}`, notificationData);
  },

  deleteNotification(id: string) {
    return api.delete(`/admin/notifications/${id}`);
  },

  // Reports
  getSalesReport(params?: any) {
    return api.get('/admin/reports/sales', { params });
  },

  getProductsReport(params?: any) {
    return api.get('/admin/reports/products', { params });
  },

  getUsersReport(params?: any) {
    return api.get('/admin/reports/users', { params });
  },

  getOrdersReport(params?: any) {
    return api.get('/admin/reports/orders', { params });
  },

  exportReport(reportType: string, params?: any) {
    return api.get(`/api/admin/reports/export/${reportType}`, { 
      params, 
      responseType: 'blob' 
    });
  }
};

export default AdminService;