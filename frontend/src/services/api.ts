import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import authService from './authService';
import { API_URL } from '../config';

// Sửa lại cấu hình baseURL để khớp với backend
// API_URL là 'http://localhost:8080'
// Các endpoint trong backend đã bao gồm tiền tố '/api', do đó không cần thêm vào baseURL
const instance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Add timeout to prevent hanging requests
});

console.log('API client created with baseURL:', API_URL);

// Request interceptor for adding auth token
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      // For requests to admin endpoints, log extra details
      const isAdminRequest = config.url && (
        config.url.includes('/admin') || 
        config.url.includes('/api/chat/sessions/active') ||
        config.url.includes('/api/chat/sessions/all')
      );
      
      if (isAdminRequest) {
        console.log('Making admin request to:', config.url);
      }
      
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log('No user data found in localStorage for request:', config.url);
        return config;
      }

      const user = JSON.parse(userStr);
      // Kiểm tra cả hai loại token có thể có
      const token = user.accessToken || user.token;
      
      if (token) {
        // Đảm bảo token được định dạng đúng
        config.headers.Authorization = `Bearer ${token}`;
        
        if (isAdminRequest) {
          console.log('Admin request - token added to request:', config.url);
          console.log('Token format valid:', token.startsWith('ey'));
          console.log('User roles:', user.roles);
          console.log('Is admin:', user.roles && (
            Array.isArray(user.roles) ? 
              user.roles.some((r: string) => r === 'ADMIN' || r === 'ROLE_ADMIN') : 
              user.roles === 'ADMIN' || user.roles === 'ROLE_ADMIN'
          ));
        } else {
          console.log('Token added to request:', config.url);
        }
      } else {
        console.log('No token available for request:', config.url);
      }

      // Nếu user đang đăng nhập, thêm userId vào params
      if (user?.id) {
        config.params = config.params || {};
        config.params.currentUserId = user.id;
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expired cases
instance.interceptors.response.use(
  (res: AxiosResponse) => {
    // Đảm bảo thông tin user trong response luôn nhất quán
    if (res.data && typeof res.data === 'object') {
      // Nếu response chứa reviews, xử lý userId cho mỗi review
      if (res.data.reviews && Array.isArray(res.data.reviews)) {
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        
        res.data.reviews = res.data.reviews.map((review: any) => {
          // Đối với review không có userId nhưng thuộc current user
          if (!review.userId && currentUser && review.user 
              && review.user.username === currentUser.username) {
            return {
              ...review,
              userId: currentUser.id,
              user: {
                ...review.user,
                id: currentUser.id
              }
            };
          }
          return review;
        });
      }
    }
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    
    // Check if this is an admin request
    const isAdminRequest = originalConfig.url && (
      originalConfig.url.includes('/admin') || 
      originalConfig.url.includes('/api/chat/sessions/active') ||
      originalConfig.url.includes('/api/chat/sessions/all')
    );

    // Danh sách các endpoint không yêu cầu xác thực
    const publicEndpoints = [
      '/products', 
      '/categories', 
      '/auth/signin',
      '/auth/signup',
      '/products/recommended'
    ];
    
    // Kiểm tra xem URL hiện tại có phải là public endpoint
    const isPublicRequest = publicEndpoints.some(endpoint => 
      originalConfig.url?.includes(endpoint)
    );

    if (err.response) {
      // For admin requests with 403 Forbidden
      if (isAdminRequest && err.response.status === 403) {
        console.error('403 Forbidden error on admin request:', originalConfig.url);
        console.error('This usually means the user is not recognized as an admin');
        
        // Log user information from localStorage
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            console.error('User from localStorage:', {
              id: user.id,
              username: user.username,
              roles: user.roles,
              tokenExists: !!user.accessToken || !!user.token
            });
          } else {
            console.error('No user found in localStorage');
          }
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
      
      // Lỗi 404
      if (err.response.status === 404) {
        console.error(`Resource not found: ${originalConfig.url}`);
        // Trả về lỗi nhưng không đăng xuất
        return Promise.reject(err);
      }
      
      // Access Token expired or invalid
      if (err.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;
        
        // Chỉ đăng xuất nếu không phải là public endpoint
        if (!isPublicRequest) {
          console.error('Unauthorized request for protected endpoint:', originalConfig.url);
          // Try refreshing token here if refresh endpoint is available
          // ...

          // For now, log out the user
          authService.logout();
          
          // Redirect to login page only if in browser environment
          if (typeof window !== 'undefined') {
            window.location.href = '/login?session=expired';
          }
        }
        
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default instance; 