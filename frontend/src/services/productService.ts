import api from './api';
import { API_URL } from '../config';
import { Product } from '../types/product';

// Interface para resposta paginada da API
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

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

  getProductById(id: string) {
    return api.get<Product>(`${API_URL}/products/${id}`);
  },


  searchProductsSafe(params: Record<string, string>) {
    console.log('Searching products with params:', params);
    
    // Kiểm tra xem có tham số lọc nâng cao không
    const hasAdvancedFilters = params.minPrice || params.maxPrice || params.minRating || params.inStock;
    
    // Nếu có lọc nâng cao, sử dụng endpoint mới
    if (hasAdvancedFilters) {
      console.log('Using advanced search endpoint with filters');
      return api.get(`${API_URL}/products/search/advanced`, { params });
    }
    
    // tìm kiếm sử dụng endpoint /search trước
    return api.get(`${API_URL}/products/search`, { params })
      .catch(error => {
        console.log('Primary search endpoint failed:', error.message);
        
        // Nếu có category, thử endpoint category
        if (params.category && params.category !== 'all') {
          console.log('Trying category endpoint as fallback');
          return api.get(`${API_URL}/products/category/${params.category}`, {
            params: { 
              keyword: params.keyword || params.search || '', 
              page: params.page, 
              size: params.size,
              sort: params.sort
            }
          });
        }

        console.log('Trying main products endpoint as fallback');
        return api.get(`${API_URL}/products`, { 
          params: { 
            keyword: params.keyword || params.search || '',
            category: params.category,
            page: params.page || '0',
            size: params.size || '12',
            sort: params.sort
          }
        });
      });
  },

  getRecommendedProducts() {
    return api.get<Product[]>(`${API_URL}/products/recommended`);
  },



  getCategories() {
    return api.get(`${API_URL}/categories`);
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
    return api.get(`${API_URL}/products/search`, {
      params: { 
        keyword: term,
        size: 5,  
        autocomplete: true
      }
    }).catch(() => {

      return api.get(`${API_URL}/products`, {
        params: { keyword: term, size: 5 }
      }).catch(() => {

        return Promise.resolve({
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        });
      });
    });
  },

  // Phương thức để lấy giá cao nhất của sản phẩm
  getMaxPrice() {
    return api.get(`${API_URL}/products/max-price`)
      .catch(() => {
        return Promise.resolve({
          data: { maxPrice: 100000000 },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any
        });
      });
  },

  // Phương thức đánh dấu đánh giá là hữu ích
  markReviewHelpful(reviewId: string,isHelpful:boolean) {
    return api.post(`${API_URL}/reviews/${reviewId}/helpful?isHelpful=${isHelpful}`);
  },

  getTopProducts(limit: number = 4) {
    return api.get<Product[]>(`${API_URL}/products/top?limit=${limit}`);
  },

  // Lấy sản phẩm bán chạy nhất theo tháng và năm
  getTopProductsByMonth(month?: number, year?: number, limit: number = 10) {
    // Nếu không có tháng, lấy tháng trước
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    // Nếu không có tháng, lấy tháng trước
    const targetMonth = month || (currentMonth === 1 ? 12 : currentMonth - 1);
    // Nếu không có năm, lấy năm trước
    const targetYear = year || (month ? currentYear : (currentMonth === 1 ? currentYear - 1 : currentYear));
    
    return api.get<Product[]>(`${API_URL}/products/top-by-month`, {
      params: {
        month: targetMonth,
        year: targetYear,
        limit
      }
    });
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



  // Add a new method for simple review submission
  addSimpleReview: (productId: string, reviewData: any) => {
    console.log('Sending simple review data:', reviewData);
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
  },

  buildSearchQueryParams: (filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
    sort?: string;
    page?: number;
    size?: number;
  }) => {
    const params: Record<string, string> = {};
    
    if (filters.search) params.search = filters.search;
    if (filters.category && filters.category !== 'all') params.category = filters.category;
    if (filters.minPrice !== undefined && filters.minPrice > 0) params.minPrice = filters.minPrice.toString();
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice.toString();
    if (filters.minRating !== undefined) params.minRating = filters.minRating.toString();
    if (filters.inStock) params.inStock = 'true';
    if (filters.sort) params.sort = filters.sort;
    if (filters.page !== undefined) params.page = filters.page.toString();
    if (filters.size !== undefined) params.size = filters.size.toString();
    
    return params;
  },
  getDailyCouponIds(){ 
    return api.get(`${API_URL}/products/daily-coupons`); 
  },
  getDailyCoupon(productId: string) {
    return api.put(`${API_URL}/products/${productId}/daily-coupon`);
  }

};

export default ProductService;