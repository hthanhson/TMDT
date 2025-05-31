// Common type definitions for the application

export interface Category {
  id: string | number;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  stock: number;
  imageUrl: string;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  enabled: boolean;
  coupons?: string[];
  createdAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    email: string;
    displayName?: string;
  };
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: any[];
} 