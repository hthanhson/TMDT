import api from './api';
import { API_URL } from '../config';
import { Order, OrderData, OrderSummary } from '../types/order';

// Create a named instance before exporting
const OrderService = {
  getOrders() {
    return api.get<Order[]>(`/orders/my-orders`);
  },

  getOrderById(id: string) {
    return api.get<Order>(`/orders/${id}`);
  },

  createOrder(orderData: OrderData) {
    return api.post<Order>(`/orders`, orderData);
  },
  createPay(orderData: OrderData) {
    return api.post<string>(`/orders/pay`, orderData);
  },
  cancelOrder(id: string | number) {
    return api.put(`/orders/${id}/cancel`, {});
  },

  refundOrder(id: string | number) {
    return api.put(`/orders/${id}/refund`, {});
  },

  requestRefund(id: string | number, formData: FormData) {
    return api.put(`/orders/${id}/request-refund`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  getOrderSummary() {
    return api.get<OrderSummary>(`/orders/summary`);
  },

  // Get all refund requests for the current user
  getRefundRequests: async () => {
    try {
      // Fetch only current user's orders (USER or ADMIN allowed)
      const response = await api.get('/orders/my-orders');
      // Filter orders that have a refundStatus (requested or processed)
      const refundOrders: Order[] = (response.data as Order[]).filter(
        (order) => order.refundStatus !== undefined && order.refundStatus !== null
      );
      return { data: refundOrders };
    } catch (error: any) {
      console.error('Error fetching refund requests:', error);
      console.error('Error details:', error.response?.status, error.response?.data, error.response?.headers);
      throw error;
    }
  },
};

export default OrderService; 