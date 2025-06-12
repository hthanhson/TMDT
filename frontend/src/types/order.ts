export interface OrderItem {
  id: number;
  product: Product;
  productName: string;
  productImage?: string;
  productImageUrl?: string;
  price: number;
  quantity: number;
}
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  categoryId?: string | number;
  categoryName?: string;
  stock: number;
  rating: number;

}

export interface RefundRequest {
  id: number;
  orderId: number;
  reason: string;
  additionalInfo?: string;
  status: 'REQUESTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

export interface Order {
  id: number;
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED' | string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  totalAmount: number;
  orderItems: OrderItem[];
  discountAmount?: number;
  refundStatus?: 'REQUESTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  refundRequest?: RefundRequest;
  refundReason?: string;
  refundImages?: string[];
  coupon?: {
    id: number;
    code: string;
    description: string;
  };
}

export interface OrderData {
  shippingAddress: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  paymentMethod: string;
  phoneNumber: string;
  recipientName: string;
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