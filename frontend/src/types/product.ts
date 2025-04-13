export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  rating: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  anonymous?: boolean;
  isAnonymous?: boolean;
  createdAt?: string;
  fullName?: string;
  user?: {
    id: string | number;
    username: string;
    fullName?: string;
  };
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
} 