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

  cancelOrder(id: string | number) {
    return api.put(`/orders/${id}/cancel`, {});
  },

  getOrderSummary() {
    return api.get<OrderSummary>(`/orders/summary`);
  }
};

export default OrderService; 