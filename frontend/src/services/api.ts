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
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = user.accessToken || user.token;
    
    if (token) {
      // Log cho debugging
      console.log('Adding token to request');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('No token available for request');
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
      '/auth',
      '/products/recommended'
    ];
    
    // Kiểm tra xem URL hiện tại có phải là public endpoint
    const isPublicRequest = publicEndpoints.some(endpoint => 
      originalConfig.url?.startsWith(endpoint)
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
          // Handle unauthorized error
          authService.logout();
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);

export default instance; 