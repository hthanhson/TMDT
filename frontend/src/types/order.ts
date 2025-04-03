export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  productImageUrl?: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  totalAmount: number;
  orderItems: OrderItem[];
}

export interface OrderData {
  items: Array<{
    productId: string | number;
    quantity: number;
  }>;
  shippingAddress: string;
  paymentMethod: string;
}

export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  recentOrders: Array<{
    id: number;
    createdAt: string;
    status: string;
    totalAmount: number;
  }>;
} 