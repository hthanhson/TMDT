import api from './api';

interface VerifyCouponResponse {
  valid: boolean;
  coupon?: {
    id: number;
    code: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    minPurchaseAmount: number;
  };
  message: string;
}

const CouponService = {
  // Get user's active coupons
  getMyCoupons() {
    return api.get('/coupons/my-coupons');
  },

  // Verify a coupon code
  verifyCoupon(code: string, orderAmount: number) {
    return api.post<VerifyCouponResponse>('/coupons/verify', {
      code,
      orderAmount
    });
  }
};

export default CouponService; 