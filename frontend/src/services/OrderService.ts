import api from './api';
import { API_URL } from '../config';
import { Order, OrderData, OrderSummary } from '../types/order';

// Create a named instance before exporting
const OrderService = {
  getOrders() {
    return api.get<Order[]>(`/orders/my-orders`);
  },
  transaction() {
    return api.get<string>(`/PaySuccess`);
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

  getRefundStatus(id: string | number) {
    return api.get(`/orders/${id}/refund-status`);
  },

  getOrderSummary() {
    return api.get<OrderSummary>(`/orders/summary`);
  }
};

export default OrderService; 