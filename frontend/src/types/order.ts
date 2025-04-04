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
  discountAmount?: number;
  coupon?: {
    id: number;
    code: string;
    description: string;
  };
}

export interface OrderData {
  items: Array<{
    productId: string | number;
    quantity: number;
  }>;
  shippingAddress: string;
  paymentMethod: string;
  couponCode?: string;
  total?: number;
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