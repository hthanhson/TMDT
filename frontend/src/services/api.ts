import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import authService from './authService';
import { API_URL } from '../config';

// Sửa lại cấu hình baseURL để khớp với backend
// Không cần thêm '/api' vào baseURL vì backend đã không còn context-path '/api'
const instance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Add timeout to prevent hanging requests
});

// Request interceptor for adding auth token
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.log('No user data found in localStorage');
        return config;
      }

      const user = JSON.parse(userStr);
      // Kiểm tra cả hai loại token có thể có
      const token = user.accessToken || user.token;
      
      if (token) {
        // Đảm bảo token được định dạng đúng
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token added to request:', config.url);
      } else {
        console.log('No token available for request:', config.url);
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
    return res;
  },
  async (err) => {
    const originalConfig = err.config;

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