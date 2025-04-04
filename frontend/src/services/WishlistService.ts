import api from './api';
import authService from './authService';

const WishlistService = {
  getWishlist: async () => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const user = authService.getCurrentUser();
    if (!user) {
      console.warn('Attempted to get wishlist without being logged in');
      return { data: [] };
    }
    
    try {
      return await api.get('/wishlist');
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return { data: [] };
    }
  },

  addToWishlist: async (productId: string) => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const user = authService.getCurrentUser();
    if (!user) {
      console.warn('Attempted to add to wishlist without being logged in');
      throw new Error('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích');
    }
    
    try {
      const response = await api.post(`/wishlist/${productId}`, {});
      console.log('Product added to wishlist:', productId);
      return response;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  },

  removeFromWishlist: async (productId: string) => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const user = authService.getCurrentUser();
    if (!user) {
      console.warn('Attempted to remove from wishlist without being logged in');
      throw new Error('Vui lòng đăng nhập để xóa sản phẩm khỏi danh sách yêu thích');
    }
    
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      console.log('Product removed from wishlist:', productId);
      return response;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      throw error;
    }
  },

  checkInWishlist: async (productId: string) => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    const user = authService.getCurrentUser();
    if (!user) {
      console.warn('Attempted to check wishlist without being logged in');
      return { data: false };
    }
    
    try {
      const response = await api.get(`/wishlist/check/${productId}`);
      // Đảm bảo trả về boolean ngay cả khi API có thể trả về các giá trị khác
      return { data: !!response.data };
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      // Nếu có lỗi, có thể sản phẩm không có trong danh sách yêu thích
      return { data: false };
    }
  }
};

export default WishlistService; 