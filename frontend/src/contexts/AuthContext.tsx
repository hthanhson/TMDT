import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import api from '../services/api';
import { UserData, AuthContextType } from '../types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for saved token on mount
    const user = authService.getCurrentUser();
    if (user) {
      setUser(user);
    }
    setLoading(false);
  }, []);
  
  const login = async (username: string, password: string): Promise<UserData> => {
    try {
      const userData = await authService.login(username, password);
      // Đảm bảo userData và token được lưu trữ đúng cách
      if (userData) {
        // Kiểm tra nếu API trả về token thay vì accessToken
        if (userData.token && !userData.accessToken) {
          // Chuyển đổi token thành accessToken để phù hợp với UserData interface
          userData.accessToken = userData.token;
          // Xóa trường token nếu không cần thiết
          delete (userData as any).token;
        }
        
        if (userData.accessToken) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
          // Đảm bảo cập nhật state ngay lập tức sau khi đăng nhập thành công
          console.log('User authenticated:', userData);
          
          // Log user roles để debug
          console.log('User roles:', userData.roles);
        } else {
          console.warn('Login response missing token or user data');
        }
      }
      setError(null);
      return userData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to login';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      await authService.register(username, email, password);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to register';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };
  
  const logout = () => {
    authService.logout();
    setUser(null);
  };
  
  // Kiểm tra xác thực dựa trên sự tồn tại của user và accessToken/token
  // Đảm bảo kiểm tra cả trong localStorage để tránh trường hợp user chưa được cập nhật
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const isAuthenticated = (!!user && (!!user?.accessToken || !!(user as any)?.token)) || 
                         (!!storedUser && (!!storedUser.accessToken || !!(storedUser as any)?.token));
  
  // Kiểm tra vai trò admin
  const checkUserRoles = (userData: UserData | null) => {
    if (!userData) return false;
    
    // Log để debug
    console.log('Checking admin role for user:', userData.username);
    console.log('User roles:', userData.roles);
    
    return userData.roles && Array.isArray(userData.roles) && userData.roles.includes('ROLE_ADMIN');
  };
  
  // Ưu tiên sử dụng user từ state, nếu không có thì kiểm tra storedUser
  const isAdmin = checkUserRoles(user) || (storedUser && checkUserRoles(storedUser));
  
  const value = {
    user,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    loading,
    error
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// We can't edit the file directly, but here's what you would add:
// Add a new function to invalidate notifications in the auth context
// This would trigger a refresh for all components that are subscribed to auth context
// invalidateNotifications: () => {
//   // This would signal that notifications need to be refreshed
//   dispatch({ type: 'INVALIDATE_NOTIFICATIONS' });
// }