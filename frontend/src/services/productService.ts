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
  getAllProducts(params?: ProductQueryParams) {
    return api.get<Product[]>(`${API_URL}/products`, { params });
  },

  getProductById(id: string) {
    return api.get<Product>(`${API_URL}/products/${id}`);
  },

  getProductsByCategory(category: string) {
    return api.get<Product[]>(`${API_URL}/products/category/${category}`);
  },

  searchProducts(params: Record<string, string>) {
    // Constrói a URL com query params
    const queryParams = new URLSearchParams();
    
    // Adiciona cada parâmetro à query string
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    // Para compatibilidade, verifique se precisamos ajustar os parâmetros
    if (params.search && !params.keyword && !params.term) {
      queryParams.append('keyword', params.search);
    }
    
    console.log('Search query params:', queryParams.toString());
    
    // Faz a requisição com os parâmetros de busca
    return api.get(`${API_URL}/products/search?${queryParams.toString()}`);
  },
  
  // Método para buscar produtos com suporte a tratamento de erros
  searchProductsSafe(params: Record<string, string>) {
    // Obter parâmetros específicos de busca
    const keyword = params.keyword || params.search || params.query || '';
    const category = params.category || '';
    
    // Log de informações sobre a busca
    if (keyword) console.log(`Searching for products with keyword: ${keyword}`);
    if (category) console.log(`Filtering by category: ${category}`);
    
    // Array de promises para tentar diferentes endpoints
    const searchPromises: Promise<any>[] = [];
    
    // 1. Tentar o endpoint principal de busca
    searchPromises.push(
      this.searchProducts(params)
        .catch(error => {
          console.log('Primary search endpoint failed:', error.message);
          return Promise.reject(error);
        })
    );
    
    // 2. Tentar busca por categoria (se a categoria estiver especificada)
    if (category) {
      searchPromises.push(
        api.get(`${API_URL}/products/category/${category}`, {
          params: { keyword, page: params.page, size: params.size }
        }).catch(error => {
          console.log('Category search endpoint failed:', error.message);
          return Promise.reject(error);
        })
      );
    }
    
    // 3. Tentar busca geral
    searchPromises.push(
      api.get(`${API_URL}/products`, { 
        params: { 
          keyword, 
          category,
          page: params.page || 0,
          size: params.size || 12,
          sort: params.sort
        }
      }).catch(error => {
        console.log('General products endpoint failed:', error.message);
        return Promise.reject(error);
      })
    );
    
    // Tentar cada endpoint em sequência, até que um deles funcione
    return new Promise<any>((resolve) => {
      // Tentar o primeiro endpoint
      searchPromises[0]
        .then((response: any) => {
          console.log('Primary search endpoint succeeded');
          resolve(response);
        })
        .catch(() => {
          // Se falhar, tentar o próximo endpoint
          if (searchPromises.length > 1) {
            searchPromises[1]
              .then((response: any) => {
                console.log('Alternative search endpoint succeeded');
                resolve(response);
              })
              .catch(() => {
                // Se falhar, tentar o último endpoint
                if (searchPromises.length > 2) {
                  searchPromises[2]
                    .then((response: any) => {
                      console.log('Fallback search endpoint succeeded');
                      resolve(response);
                    })
                    .catch(() => {
                      // Se todos falharem, retornar uma resposta vazia
                      console.error('All search endpoints failed');
                      resolve({
                        data: [],
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config: {} as any
                      });
                    });
                } else {
                  // Se não houver terceiro endpoint, retornar uma resposta vazia
                  console.error('All search endpoints failed');
                  resolve({
                    data: [],
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: {} as any
                  });
                }
              });
          } else {
            // Se só houver um endpoint, retornar uma resposta vazia
            console.error('Search endpoint failed');
            resolve({
              data: [],
              status: 200,
              statusText: 'OK',
              headers: {},
              config: {} as any
            });
          }
        });
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
    // Alterando o endpoint para corresponder ao que existe no backend
    return api.get(`${API_URL}/products/search`, {
      params: { 
        keyword: term,
        size: 5,  // Limitar a 5 sugestões
        autocomplete: true
      }
    }).catch(() => {
      // Tentar um endpoint alternativo
      return api.get(`${API_URL}/products`, {
        params: { keyword: term, size: 5 }
      }).catch(() => {
        // Se ambos falharem, retornar um objeto compatível com AxiosResponse
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
        // Retornar um valor padrão em caso de erro, com estrutura AxiosResponse
        return Promise.resolve({
          data: { maxPrice: 10000000 },
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
  },

  // Método auxiliar que converte objetos de filtro para query params
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
  }
};

export default ProductService;