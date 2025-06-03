export interface Notification {
  id: number;
  userId: number;
  message: string;
  title?: string;
  content?: string;
  type: 'ORDER' | 'ORDER_STATUS_CHANGE' | 'SYSTEM' | 'SYSTEM_ANNOUNCEMENT' | 'PROMOTION' | 'warning' | 'error' | 'success';
  isRead: boolean;
  read?: boolean;
  createdAt: string;
  timestamp?: string;
  additionalData?: Record<string, any>;
} 