import api from './api';
import authHeader from './AuthHeader';

const WishlistService = {
  getWishlist: async () => {
    return api.get('/wishlist');
  },

  addToWishlist: async (productId: string) => {
    return api.post(`/wishlist/${productId}`, {});
  },

  removeFromWishlist: async (productId: string) => {
    return api.delete(`/wishlist/${productId}`);
  },

  checkInWishlist: async (productId: string) => {
    try {
      const response = await api.get(`/wishlist/check/${productId}`);
      // Đảm bảo trả về boolean ngay cả khi API có thể trả về các giá trị khác
      return { data: !!response.data };
    } catch (error) {
      // Nếu có lỗi, có thể sản phẩm không có trong danh sách yêu thích
      return { data: false };
    }
  }
};

export default WishlistService; 