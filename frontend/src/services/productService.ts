import api from './api';
import { API_URL } from '../config';
import { Product } from '../types/product';

interface ProductQueryParams {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}

const ProductService = {
  getAllProducts(params?: ProductQueryParams) {
    return api.get<Product[]>('/products', { params });
  },

  getProductById(id: string) {
    return api.get<Product>(`/products/${id}`);
  },

  getTopProducts(limit: number = 4) {
    return api.get<Product[]>(`/products/top?limit=${limit}`);
  },

  getFeaturedProducts() {
    return api.get<Product[]>('/products/recommended');
  },

  searchProducts(query: string) {
    return api.get<Product[]>('/products/search', { params: { query } });
  },

  getProductsByCategory(categoryId: string) {
    return api.get<Product[]>(`/products/category/${categoryId}`);
  },

  getRelatedProducts(productId: string, limit = 4) {
    // Sử dụng API khuyến nghị sản phẩm thay vì API related không tồn tại
    return api.get<Product[]>('/products/recommended', { params: { limit } });
  },

  getCategories() {
    // Sử dụng endpoint categories từ CategoryController
    return api.get<string[]>('/categories');
  },

  getRecommendedProducts(limit = 4) {
    return api.get<Product[]>('/products/recommended', { params: { limit } });
  },

  addReview(productId: string, reviewData: any) {
    return api.post(`/products/${productId}/reviews`, reviewData);
  },

  // Favorites management
  getFavorites() {
    return api.get<Product[]>('/wishlist').then(response => {
      const productsWithReviews = response.data.map((product: any) => ({
        ...product,
        reviews: product.reviews || []
      }));
      
      return {
        ...response,
        data: productsWithReviews
      };
    });
  },

  addToFavorites(productId: string) {
    return api.post(`/wishlist/${productId}`);
  },

  removeFromFavorites(productId: string) {
    return api.delete(`/wishlist/${productId}`);
  },
  
  checkInFavorites(productId: string) {
    // Kiểm tra sản phẩm có trong danh sách yêu thích bằng cách lấy toàn bộ danh sách và kiểm tra
    return this.getFavorites().then(response => {
      const favorites = response.data;
      return { data: favorites.some((product: Product) => product.id === productId) };
    });
  },

  getProductReviews(productId: string) {
    return api.get(`/products/${productId}/reviews`);
  },

  addProductReview(productId: string, reviewData: { rating: number; comment: string }) {
    return api.post(`/products/${productId}/reviews`, reviewData);
  }
};

export default ProductService;