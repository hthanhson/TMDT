import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NotificationService from '../services/NotificationService';
import { Notification } from '../types/notification';
import { useAuth } from './AuthContext';

// Define the context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

// Create the context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

// Custom hook to use the notification context
export const useNotification = () => useContext(NotificationContext);

// Helper function to check if a notification is read
const isNotificationRead = (notification: any) => {
  // Check both 'isRead' and 'read' properties since the API is using 'read'
  const isReadValue = notification.isRead !== undefined ? notification.isRead : notification.read;
  
  // Convert considering all possible formats
  return isReadValue === true || 
    (typeof isReadValue === 'number' && isReadValue === 1) || 
    (typeof isReadValue === 'string' && isReadValue === "1") || 
    (typeof isReadValue === 'string' && isReadValue === "true");
};

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Calculate unread count
  const unreadCount = notifications.filter(n => !isNotificationRead(n)).length;

  // Fetch notifications function
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    console.log('NotificationContext: Refreshing notifications');
    setLoading(true);
    
    try {
      const response = await NotificationService.getNotifications();
      setNotifications(response.data);
      console.log('NotificationContext: Notifications refreshed, count:', response.data.length);
      
      // Update last refresh timestamp
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('NotificationContext: Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Mark a notification as read
  const markAsRead = async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      
      // Update local notifications
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === id ? { ...n, isRead: true, read: true } : n
        )
      );
      
      // Also refresh to ensure synchronized state
      refreshNotifications();
    } catch (error) {
      console.error('NotificationContext: Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      
      // Update local notifications
      setNotifications(prevNotifications => 
        prevNotifications.map(n => ({ ...n, isRead: true, read: true }))
      );
      
      // Also refresh to ensure synchronized state
      refreshNotifications();
    } catch (error) {
      console.error('NotificationContext: Error marking all notifications as read:', error);
    }
  };

  // Initialize notifications when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, refreshNotifications]);

  // Refresh notifications periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const intervalId = setInterval(() => {
      refreshNotifications();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshNotifications]);

  // Create the context value
  const value = {
    notifications,
    unreadCount,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Global refresh function that can be called from anywhere
export const refreshGlobalNotifications = async () => {
  try {
    const response = await NotificationService.getNotifications();
    console.log('Global notification refresh, count:', response.data.length);
    return response.data;
  } catch (error) {
    console.error('Error in global notification refresh:', error);
    return [];
  }
}; 