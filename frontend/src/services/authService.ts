import axios from 'axios';
import { API_URL } from '../config';
import api from './api';
import { UserData } from '../types/user';

// Create a named instance before exporting
const AuthService = {
  async login(username: string, password: string): Promise<UserData> {
    console.log('Login request:', { username, password: '******' });
    try {
      // Sử dụng axios trực tiếp thay vì api instance để tránh vấn đề với baseURL
      const response = await axios.post(`http://localhost:8080/auth/signin`, {
        username,
        password,
      });
      
      // Kiểm tra và thống nhất format token
      if (response.data) {
        // Đảm bảo dữ liệu có accessToken
        if (response.data.token && !response.data.accessToken) {
          response.data.accessToken = response.data.token;
          // Xóa trường token nếu không cần thiết
          delete response.data.token;
        }
        
        // Lưu user vào localStorage
        if (response.data.accessToken) {
          // Log để debug
          console.log('Saving user with token to localStorage');
          console.log('Token format valid:', response.data.accessToken.startsWith('ey'));
          console.log('Token length:', response.data.accessToken.length);
          
          localStorage.setItem('user', JSON.stringify(response.data));
          
          // Lưu vai trò chính để sử dụng cho việc chuyển hướng
          if (response.data.primaryRole) {
            localStorage.setItem("primaryRole", response.data.primaryRole);
          }
        } else {
          console.error('Login response missing token:', response.data);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout(): void {
    // Emit a global event before clearing localStorage
    try {
      const logoutEvent = new CustomEvent('user-logged-out', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(logoutEvent);
      console.log('Dispatched user-logged-out event');
    } catch (e) {
      console.error('Error dispatching logout event:', e);
    }
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('primaryRole');
    console.log('User logged out, localStorage cleared');
  },

  async register(username: string, email: string, password: string, fullName?: string, phoneNumber?: string, address?: string): Promise<void> {
    const userData = {
      username,
      email,
      password,
      fullName,
      phoneNumber,
      address
    };
    console.log('Register request:', { ...userData, password: '******' });
    
    try {
      // Sử dụng axios trực tiếp với URL đầy đủ
      const response = await axios.post(`http://localhost:8080/auth/signup`, userData);
      console.log('Register response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Register axios error:', error);
      throw error;
    }
  },

  async registerShipper(username: string, email: string, password: string, fullName: string, phoneNumber: string, address: string): Promise<void> {
    const userData = {
      username,
      email,
      password,
      fullName,
      phoneNumber,
      address
    };
    console.log('Register shipper request:', { ...userData, password: '******' });
    
    try {
      // Sử dụng axios trực tiếp với URL đầy đủ
      const response = await axios.post(`http://localhost:8080/auth/signup/shipper`, userData);
      console.log('Register shipper response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Register shipper axios error:', error);
      throw error;
    }
  },

  getCurrentUser(): UserData | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },

  getPrimaryRole(): string | null {
    return localStorage.getItem("primaryRole");
  },

  getAuthHeader(): { Authorization: string } | {} {
    const user = this.getCurrentUser();
    // Kiểm tra token
    if (user) {
      const token = user.accessToken || (user as any).token;
      if (token) {
        // Log để debug
        console.log('Using token for auth header. Format valid:', token.startsWith('ey'));
        return { Authorization: `Bearer ${token}` };
      } else {
        console.error('No token found in user object:', user);
      }
    } else {
      console.log('No user found in localStorage for auth header');
    }
    return {};
  },

  // Phương thức kiểm tra vai trò để chuyển hướng
  redirectBasedOnRole(): void {
    const primaryRole = this.getPrimaryRole();
    
    if (primaryRole === 'ROLE_ADMIN') {
      window.location.href = '/admin/dashboard';
    } else if (primaryRole === 'ROLE_SHIPPER') {
      window.location.href = '/shipper/dashboard';
    } else if (primaryRole === 'ROLE_MODERATOR') {
      window.location.href = '/moderator';
    } else {
      window.location.href = '/';
    }
  },

  // Kiểm tra xem người dùng hiện tại có vai trò shipper không
  isShipper(): boolean {
    const user = this.getCurrentUser();
    return !!(user && user.roles && user.roles.includes('ROLE_SHIPPER'));
  },
  
  // Kiểm tra xem người dùng hiện tại có vai trò admin không
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return !!(user && user.roles && user.roles.includes('ROLE_ADMIN'));
  },

  

};

export default AuthService;