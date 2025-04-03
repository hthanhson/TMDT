export interface Notification {
  id: number;
  userId: number;
  message: string;
  type: 'ORDER' | 'SYSTEM' | 'PROMOTION';
  isRead: boolean;
  createdAt: string;
  additionalData?: Record<string, any>;
} 