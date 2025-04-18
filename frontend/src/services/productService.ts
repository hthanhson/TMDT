import api from './api';
import { API_URL } from '../config';
import { Product } from '../types/product';

export interface ProductQueryParams {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  page?: number;
  size?: number;
}

interface ReviewData {
  rating: number;
  comment: string;
  isAnonymous?: boolean;
}

const ProductService = {
  getAllProducts(params?: ProductQueryParams) {
    return api.get<Product[]>(`${API_URL}/products`, { params });
  },

  getProductById(id: string) {
    return api.get<Product>(`${API_URL}/products/${id}`);
  },

  getProductsByCategory(category: string) {
    return api.get<Product[]>(`${API_URL}/products/category/${category}`);
  },

  searchProducts(query: string) {
    return api.get<Product[]>(`${API_URL}/products/search`, {
      params: { query }
    });
  },

  getRecommendedProducts() {
    return api.get<Product[]>(`${API_URL}/products/recommended`);
  },

  getTopSellingProducts() {
    return api.get<Product[]>(`${API_URL}/products/top-selling`);
  },

  getCategories() {
    return api.get(`${API_URL}/categories`);
  },

  rateProduct(productId: string, rating: number) {
    return api.post(`${API_URL}/products/${productId}/rate`, { rating });
  },

  addToWishlist(productId: string) {
    return api.post(`${API_URL}/wishlist/add/${productId}`);
  },

  removeFromWishlist(productId: string) {
    return api.delete(`${API_URL}/wishlist/remove/${productId}`);
  },

  getProductReviews(productId: string) {
    return api.get(`${API_URL}/products/${productId}/reviews`);
  },

  addReview(productId: string, reviewData: ReviewData) {
    console.log('Sending review data:', reviewData);
    return api.post(`${API_URL}/products/${productId}/reviews`, reviewData, {
      params: {
        includeUserDetails: true, // Đảm bảo server trả về thông tin người dùng đầy đủ
        allowMultiple: true // Cho phép người dùng đánh giá nhiều lần
      }
    });
  },

  // Phương thức để lấy gợi ý tìm kiếm
  getSearchSuggestions(term: string) {
    return api.get(`${API_URL}/products/search/suggestions`, {
      params: { term }
    });
  },

  // Phương thức để lấy giá cao nhất của sản phẩm
  getMaxPrice() {
    return api.get(`${API_URL}/products/max-price`);
  },

  // Phương thức đánh dấu đánh giá là hữu ích
  markReviewHelpful(reviewId: string,isHelpful:boolean) {
    return api.post(`${API_URL}/reviews/${reviewId}/helpful?isHelpful=${isHelpful}`);
  },

  getTopProducts(limit: number = 4) {
    return api.get<Product[]>(`/products/top?limit=${limit}`);
  },

  getFeaturedProducts() {
    return api.get<Product[]>('/products/recommended');
  },

  getRelatedProducts(productId: string, limit = 4) {
    // Sử dụng API khuyến nghị sản phẩm thay vì API related không tồn tại
    return api.get<Product[]>('/products/recommended', { params: { limit } });
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

  addProductReview(productId: string, reviewData: { rating: number; comment: string }) {
    return api.post(`/products/${productId}/reviews`, reviewData);
  },

  // Add a new method for simple review submission
  addSimpleReview: (productId: string, reviewData: any) => {
    console.log('Sending simple review data:', reviewData);
    // Use URLSearchParams to properly format the request parameters
    const params = new URLSearchParams();
    params.append('rating', reviewData.rating.toString());
    
    if (reviewData.comment) {
      params.append('comment', reviewData.comment);
    }
    
    params.append('isAnonymous', (reviewData.isAnonymous || false).toString());
    params.append('allowMultiple', 'true'); // Cho phép người dùng đánh giá nhiều lần
    params.append('includeUserDetails', 'true'); // Đảm bảo server trả về thông tin người dùng đầy đủ
    
    return api.post(`${API_URL}/reviews/product/${productId}/simple?${params.toString()}`);
  },

  // Delete a review
  deleteReview: (reviewId: string) => {
    console.log('Sending delete request for review ID:', reviewId);
    
    // Get the auth token from localStorage
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const token = user?.accessToken || user?.token;
    
    console.log('Delete review URL:', `${API_URL}/reviews/${reviewId}`);
    console.log('User data:', user ? 'Available' : 'Not available', 'User ID:', user?.id);
    console.log('Using token for deletion:', token ? 'Token available' : 'No token');
    
    // Make sure to include the token in the request headers
    return api.delete(`/reviews/${reviewId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Lấy đánh giá của người dùng hiện tại cho một sản phẩm cụ thể
  getUserReviewsForProduct(productId: string) {
    return api.get(`${API_URL}/products/${productId}/user-reviews`, {
      params: {
        userId: this.getCurrentUserId()
      }
    });
  },
  
  // Helper method để lấy ID người dùng hiện tại
  getCurrentUserId() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.id;
    } catch (err) {
      console.error('Error parsing user data:', err);
      return null;
    }
  }
};

export default ProductService;