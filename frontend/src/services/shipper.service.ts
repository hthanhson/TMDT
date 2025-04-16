import api from './api';
import authService from './authService';

const API_URL = '/api/shipper/';

export interface StatusUpdateRequest {
  status: string;
  location: string;
  notes: string;
  latitude?: number;
  longitude?: number;
}

export interface Order {
  id: number;
  userId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress: string;
  recipientName: string;
  shipperId?: number;
  totalAmount: number;
  orderItems: any[];
  stock?: number;
}

export interface ShipmentTracking {
  id: number;
  orderId: number;
  status: string;
  location: string;
  notes?: string;
  createdAt: Date;
  createdBy: number;
  latitude?: number;
  longitude?: number;
}

export interface PagedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

class ShipperService {
  // Lấy danh sách đơn hàng có sẵn để nhận
  getAvailableOrders(page = 0, size = 10): Promise<ApiResponse<PagedResponse<Order>>> {
    return api.get(API_URL + 'orders/available', {
      params: { page, size }
    });
  }
  
  // Lấy danh sách đơn hàng của shipper
  getMyOrders(page = 0, size = 10): Promise<ApiResponse<PagedResponse<Order>>> {
    return api.get(API_URL + 'orders', {
      params: { page, size }
    });
  }
  
  // Lấy danh sách đơn hàng theo trạng thái
  getOrdersByStatus(status: string, page = 0, size = 10): Promise<ApiResponse<PagedResponse<Order>>> {
    return api.get(API_URL + 'orders', {
      params: { status, page, size }
    });
  }
  
  // Nhận đơn hàng
  acceptOrder(orderId: number): Promise<ApiResponse<Order>> {
    return api.post(API_URL + `orders/${orderId}/accept`, {});
  }
  
  // Cập nhật trạng thái đơn hàng
  updateOrderStatus(orderId: number, statusUpdateRequest: StatusUpdateRequest): Promise<ApiResponse<Order>> {
    return api.put(API_URL + `orders/${orderId}/status`, statusUpdateRequest);
  }
  
  // Lấy lịch sử vận chuyển của đơn hàng
  getOrderTrackingHistory(orderId: number): Promise<ApiResponse<ShipmentTracking[]>> {
    return api.get(API_URL + `orders/${orderId}/tracking`);
  }
}

export default new ShipperService(); 