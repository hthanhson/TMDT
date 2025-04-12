package com.example.tmdt.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.tmdt.model.Coupon;
import com.example.tmdt.model.User;
import com.example.tmdt.repository.CouponRepository;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    private static final String COUPON_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int COUPON_LENGTH = 8;
    
    public List<Coupon> getAllActiveCoupons() {
        return couponRepository.findByIsActiveAndExpiryDateAfter(true, LocalDateTime.now());
    }
    
    public List<Coupon> getCouponsByUser(User user) {
        return couponRepository.findByUser(user);
    }
    
    public List<Coupon> getActiveCouponsByUser(User user) {
        return couponRepository.findByUserAndIsActiveAndExpiryDateAfter(user, true, LocalDateTime.now());
    }
    
    @Transactional
    public Coupon createCoupon(Coupon coupon) {
        // Tạo mã coupon ngẫu nhiên nếu chưa có
        if (coupon.getCode() == null || coupon.getCode().isEmpty()) {
            coupon.setCode(generateRandomCouponCode());
        }
        
        // Đảm bảo mã coupon là duy nhất
        while (couponRepository.existsByCode(coupon.getCode())) {
            coupon.setCode(generateRandomCouponCode());
        }
        
        return couponRepository.save(coupon);
    }
    
    @Transactional
    public Coupon createUserCoupon(User user, double discountAmount, double minOrderValue, 
            LocalDateTime expiryDate, String type, String description) {
        
        Coupon coupon = new Coupon();
        coupon.setUser(user);
        coupon.setCode(generateRandomCouponCode());
        coupon.setDiscountValue(BigDecimal.valueOf(discountAmount));
        coupon.setMinPurchaseAmount(BigDecimal.valueOf(minOrderValue));
        coupon.setExpiryDate(expiryDate);
        coupon.setIsActive(true);
        coupon.setType(type);
        coupon.setDescription(description);
        
        Coupon savedCoupon = couponRepository.save(coupon);
        
        // Gửi thông báo cho user về coupon mới
        String title = "Bạn đã nhận được mã giảm giá";
        String message = String.format("Bạn đã nhận được mã giảm giá %s. %s. Hãy sử dụng mã này khi thanh toán để nhận ưu đãi!", 
                coupon.getCode(), description);
        
        // Create additional data for notification
        java.util.Map<String, Object> additionalData = new java.util.HashMap<>();
        additionalData.put("couponCode", coupon.getCode());
        additionalData.put("discountValue", discountAmount);
        additionalData.put("type", type);
        additionalData.put("expiryDate", expiryDate.toString());
        
        notificationService.createNotificationForUser(
            user, 
            title, 
            message, 
            "PROMOTION", 
            additionalData
        );
        
        return savedCoupon;
    }
    
    @Transactional
    public Coupon createGeneralCoupon(double discountAmount, double minOrderValue, 
            LocalDateTime expiryDate, String type, String description) {
        
        Coupon coupon = new Coupon();
        coupon.setUser(null); // General coupon, not assigned to a specific user
        coupon.setCode(generateRandomCouponCode());
        coupon.setDiscountValue(BigDecimal.valueOf(discountAmount));
        coupon.setMinPurchaseAmount(BigDecimal.valueOf(minOrderValue));
        coupon.setExpiryDate(expiryDate);
        coupon.setIsActive(true);
        coupon.setType(type);
        coupon.setDescription(description);
        
        Coupon savedCoupon = couponRepository.save(coupon);
        
        // Create notification for broadcast to all users
        String title = "Mã giảm giá mới";
        String message = String.format("Mã giảm giá mới: %s - %s. Hãy sử dụng mã này khi thanh toán để nhận ưu đãi!", 
                coupon.getCode(), description);
        
        // Create additional data for notification
        java.util.Map<String, Object> additionalData = new java.util.HashMap<>();
        additionalData.put("couponCode", coupon.getCode());
        additionalData.put("discountValue", discountAmount);
        additionalData.put("type", type);
        additionalData.put("expiryDate", expiryDate.toString());
        additionalData.put("description", description);
        
        // Broadcast notification to all users
        notificationService.createBroadcastNotification(
            title, 
            message, 
            "PROMOTION", 
            additionalData
        );
        
        return savedCoupon;
    }
    
    private String generateRandomCouponCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();
        
        for (int i = 0; i < COUPON_LENGTH; i++) {
            int index = random.nextInt(COUPON_CHARS.length());
            code.append(COUPON_CHARS.charAt(index));
        }
        
        return code.toString();
    }
    
    @Transactional
    public Coupon verifyCoupon(String code, User user, double orderAmount) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));
        
        // Kiểm tra coupon có active không
        if (!coupon.getIsActive()) {
            throw new RuntimeException("Coupon is not active");
        }
        
        // Kiểm tra coupon có hết hạn không
        if (coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Coupon has expired");
        }
        
        // Kiểm tra coupon có thuộc về user cụ thể không, nếu có thì kiểm tra user hiện tại
        if (coupon.getUser() != null && !coupon.getUser().equals(user)) {
            throw new RuntimeException("This coupon is not available for your account");
        }
        
        // Kiểm tra giá trị đơn hàng tối thiểu
        if (orderAmount < coupon.getMinPurchaseAmount().doubleValue()) {
            throw new RuntimeException("Order amount does not meet minimum required for this coupon");
        }
        
        return coupon;
    }
    
    @Transactional
    public void useCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));
        
        // Nếu là coupon dùng 1 lần thì deactivate
        if (coupon.getType().equals("ONE_TIME")) {
            coupon.setIsActive(false);
            couponRepository.save(coupon);
        }
    }
    
    @Transactional
    public void deactivateCoupon(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));
        
        coupon.setIsActive(false);
        couponRepository.save(coupon);
    }
    
    @Transactional
    public void deactivateExpiredCoupons() {
        List<Coupon> expiredCoupons = couponRepository.findByIsActiveAndExpiryDateBefore(true, LocalDateTime.now());
        for (Coupon coupon : expiredCoupons) {
            coupon.setIsActive(false);
            couponRepository.save(coupon);
        }
    }
    
    public double calculateDiscount(String code, double orderAmount) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Invalid coupon code"));
        
        double discount = 0;
        
        // Tính toán giảm giá dựa trên loại coupon
        if (coupon.getType().equals("PERCENTAGE")) {
            // Giảm theo phần trăm
            discount = orderAmount * (coupon.getDiscountValue().doubleValue() / 100);
        } else {
            // Giảm trực tiếp
            discount = coupon.getDiscountValue().doubleValue();
            
            // Đảm bảo discount không lớn hơn giá trị đơn hàng
            if (discount > orderAmount) {
                discount = orderAmount;
            }
        }
        
        return discount;
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public Coupon getCouponById(Long id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Coupon not found with id: " + id));
    }

    public Coupon updateCoupon(Coupon coupon) {
        // Đảm bảo coupon tồn tại
        if (coupon.getId() == null || !couponRepository.existsById(coupon.getId())) {
            throw new RuntimeException("Cannot update non-existent coupon");
        }
        
        return couponRepository.save(coupon);
    }

    public void deactivateCouponById(Long id) {
        Coupon coupon = getCouponById(id);
        coupon.setIsActive(false);
        couponRepository.save(coupon);
    }
}