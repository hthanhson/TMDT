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
    
    // Kiểm tra nếu API trả về token thay vì accessToken
    if (response.data.token && !response.data.accessToken) {
      // Chuyển đổi token thành accessToken để phù hợp với UserData interface
      response.data.accessToken = response.data.token;
      // Xóa trường token nếu không cần thiết
      delete response.data.token;
    }
    
    if (response.data.accessToken) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('user');
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
    // Kiểm tra cả accessToken và token
    if (user) {
      if (user.accessToken) {
        return { Authorization: `Bearer ${user.accessToken}` };
      } else if ((user as any).token) {
        return { Authorization: `Bearer ${(user as any).token}` };
      }
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