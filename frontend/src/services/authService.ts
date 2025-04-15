import axios from 'axios';
import { API_URL } from '../config';
import api from './api';
import { UserData } from '../types/user';

// Create a named instance before exporting
const AuthService = {
  async login(username: string, password: string): Promise<UserData> {
    console.log('Login request:', { username, password: '******' });
    const response = await api.post('/auth/signin', {
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
      } else {
        console.error('Login response missing token:', response.data);
      }
    }
    
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('user');
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
      const response = await api.post('/auth/signup', userData);
      console.log('Register response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Register axios error:', error);
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

  updateProfile(userData: Partial<UserData>): Promise<UserData> {
    return api.put('/users/profile', userData).then(
      (response) => {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, ...response.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        return response.data;
      }
    );
  },

  changePassword(oldPassword: string, newPassword: string): Promise<any> {
    return api.put('/users/change-password', {
      oldPassword,
      newPassword,
    });
  }
};

export default AuthService;