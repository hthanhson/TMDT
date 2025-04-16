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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for saved token on mount
    const user = authService.getCurrentUser();
    if (user) {
      console.log('User found in localStorage:', user);
      console.log('User roles from localStorage:', user.roles);
      setUser(user);
    } else {
      console.log('No user found in localStorage');
    }
    setLoading(false);
  }, []);
  
  // Thêm phương thức đăng nhập mới, hỗ trợ cả userData từ auth.service.ts
  const login = (userData: UserData) => {
    if (userData) {
      // Ensure roles is always an array
      if (!userData.roles) {
        userData.roles = [];
      } else if (typeof userData.roles === 'string') {
        // If roles is a string, convert to array
        userData.roles = [userData.roles];
      }
      
      // Make sure role strings are consistent
      userData.roles = userData.roles.map((role: string) => {
        // If roles don't have ROLE_ prefix, add it
        if (role && !role.startsWith('ROLE_')) {
          return `ROLE_${role.toUpperCase()}`;
        }
        return role.toUpperCase(); // Ensure consistent casing
      });
      
      console.log('Saving user with normalized roles:', userData.roles);
      setUser(userData);
      
      // Log more details for debugging
      console.log('User authenticated:', userData);
      console.log('User roles:', userData.roles);
      console.log('Is admin role present?', userData.roles.includes('ROLE_ADMIN'));
      console.log('Is shipper role present?', userData.roles.includes('ROLE_SHIPPER'));
    }
    setError(null);
    return userData;
  };
  
  // Phương thức đăng nhập cũ để đảm bảo tương thích
  const loginWithCredentials = async (username: string, password: string): Promise<UserData> => {
    try {
      const userData = await authService.login(username, password);
      return login(userData);
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
    // Emit a custom event before logging out to notify components to disconnect WebSocket
    const logoutEvent = new CustomEvent('admin-logout', { 
      detail: { userId: user?.id } 
    });
    window.dispatchEvent(logoutEvent);
    console.log('Dispatched admin-logout event, waiting for components to process');
    
    // Wait a longer moment to allow components to process the event and disconnect websockets
    setTimeout(() => {
      console.log('Processing logout now, clearing localStorage');
      authService.logout();
      setUser(null);
    }, 300);
  };
  
  // Kiểm tra xác thực dựa trên sự tồn tại của user và accessToken/token
  // Đảm bảo kiểm tra cả trong localStorage để tránh trường hợp user chưa được cập nhật
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const isAuthenticated = (!!user && (!!user?.accessToken || !!(user as any)?.token)) || 
                         (!!storedUser && (!!storedUser.accessToken || !!(storedUser as any)?.token));
  
  // Kiểm tra vai trò admin
  const checkUserRoles = (userData: UserData | null, roleName: string) => {
    if (!userData) {
      console.log(`No user data available to check ${roleName} role`);
      return false;
    }
    
    // More detailed debug logging
    console.log(`Checking ${roleName} role for user:`, userData.username);
    console.log('User roles data type:', typeof userData.roles);
    console.log('User roles value:', userData.roles);
    
    // Make sure roles is an array
    if (!userData.roles) {
      console.warn('User roles is missing');
      return false;
    }
    
    if (!Array.isArray(userData.roles)) {
      console.warn('User roles is not an array:', userData.roles);
      // Try to convert string to array if it's a string
      if (typeof userData.roles === 'string') {
        const roleArray = [userData.roles];
        console.log('Converted string role to array:', roleArray);
        // Check if the role or ROLE_role is in the converted array
        return roleArray.some(role => 
          role === roleName || 
          role === `ROLE_${roleName}` ||
          String(role).toUpperCase() === roleName.toUpperCase() || 
          String(role).toUpperCase() === `ROLE_${roleName.toUpperCase()}`
        );
      }
      return false;
    }
    
    // Check all variations of the role
    const hasRole = userData.roles.some(role => 
      role === roleName || 
      role === `ROLE_${roleName}` || 
      String(role).toUpperCase() === roleName.toUpperCase() || 
      String(role).toUpperCase() === `ROLE_${roleName.toUpperCase()}`
    );
    
    console.log(`Is user ${roleName} based on roles check?`, hasRole);
    return hasRole;
  };
  
  // Ưu tiên sử dụng user từ state, nếu không có thì kiểm tra storedUser
  const isAdmin = checkUserRoles(user, 'ADMIN') || (storedUser && checkUserRoles(storedUser, 'ADMIN'));
  
  // Kiểm tra vai trò shipper
  const isShipper = checkUserRoles(user, 'SHIPPER') || (storedUser && checkUserRoles(storedUser, 'SHIPPER'));
  
  // Force-check role and localStorage state when admin routes are accessed
  useEffect(() => {
    // This effect runs when the component mounts to double-check admin status
    if (window.location.pathname.includes('/admin')) {
      console.log('ADMIN route accessed, checking permissions');
      console.log('Current user state:', user);
      console.log('localStorage user:', storedUser);
      console.log('isAdmin computed value:', isAdmin);
    }
    
    // Check shipper role when accessing shipper routes
    if (window.location.pathname.includes('/shipper')) {
      console.log('SHIPPER route accessed, checking permissions');
      console.log('Current user state:', user);
      console.log('localStorage user:', storedUser);
      console.log('isShipper computed value:', isShipper);
    }
  }, [window.location.pathname]);
  
  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isShipper,
    login,
    loginWithCredentials,
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