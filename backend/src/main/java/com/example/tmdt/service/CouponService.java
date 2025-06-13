package com.example.tmdt.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
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
        return couponRepository.findByUsersContaining(user);
    }
    
    public List<Coupon> getActiveCouponsByUser(User user) {
        return couponRepository.findByUsersContainingAndIsActiveAndExpiryDateAfter(user, true, LocalDateTime.now());
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
        coupon.getUsers().add(user);
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
    
//    @Transactional
//    public Coupon createGeneralCoupon(double discountAmount, double minOrderValue,
//            LocalDateTime expiryDate, String type, String description) {
//
//        Coupon coupon = new Coupon();
//        coupon.setUser(null); // General coupon, not assigned to a specific user
//        coupon.setCode(generateRandomCouponCode());
//        coupon.setDiscountValue(BigDecimal.valueOf(discountAmount));
//        coupon.setMinPurchaseAmount(BigDecimal.valueOf(minOrderValue));
//        coupon.setExpiryDate(expiryDate);
//        coupon.setIsActive(true);
//        coupon.setType(type);
//        coupon.setDescription(description);
//
//        Coupon savedCoupon = couponRepository.save(coupon);
//
//        // Create notification for broadcast to all users
//        String title = "Mã giảm giá mới";
//        String message = String.format("Mã giảm giá mới: %s - %s. Hãy sử dụng mã này khi thanh toán để nhận ưu đãi!",
//                coupon.getCode(), description);
//
//        // Create additional data for notification
//        java.util.Map<String, Object> additionalData = new java.util.HashMap<>();
//        additionalData.put("couponCode", coupon.getCode());
//        additionalData.put("discountValue", discountAmount);
//        additionalData.put("type", type);
//        additionalData.put("expiryDate", expiryDate.toString());
//        additionalData.put("description", description);
//
//        // Broadcast notification to all users
//        notificationService.createBroadcastNotification(
//            title,
//            message,
//            "PROMOTION",
//            additionalData
//        );
//
//        return savedCoupon;
//    }
    
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
        
        // Kiểm tra coupon có active không trước khi thực hiện các kiểm tra khác
        if (!coupon.getIsActive()) {
            throw new RuntimeException("Coupon is not active");
        }
        
        // Kiểm tra thời gian hiệu lực của coupon
        LocalDateTime now = LocalDateTime.now();
        
        // Kiểm tra ngày bắt đầu
        if (coupon.getStartDate() != null && now.isBefore(coupon.getStartDate())) {
            throw new RuntimeException("Coupon is not yet active, valid from: " + coupon.getStartDate());
        }
        
        // Kiểm tra coupon có hết hạn không - kiểm tra cả expiryDate và endDate
        boolean isExpired = false;
        String expiryMessage = "";
        
        // Kiểm tra theo expiryDate
        LocalDateTime expiryDate = coupon.getExpiryDate();
        if (expiryDate != null && now.isAfter(expiryDate)) {
            isExpired = true;
            expiryMessage = "Coupon has expired on: " + expiryDate;
        }
        
        // Kiểm tra theo endDate
        if (!isExpired && coupon.getEndDate() != null && now.isAfter(coupon.getEndDate())) {
            isExpired = true;
            expiryMessage = "Coupon has expired on: " + coupon.getEndDate();
        }
        
        // Nếu phiếu đã hết hạn, đánh dấu là không active và thông báo lỗi
        if (isExpired) {
            coupon.setIsActive(false);
            couponRepository.save(coupon);
            throw new RuntimeException(expiryMessage);
        }
        
        // Kiểm tra coupon có thuộc về user cụ thể không, nếu có thì kiểm tra user hiện tại
        List<User> usersCoupon = coupon.getUsers();
        if (usersCoupon != null && !usersCoupon.contains(user)) {
            throw new RuntimeException("Mã giảm giá không dành cho tài khoản của bạn");
        }
        
        // Kiểm tra giá trị đơn hàng tối thiểu
        if (orderAmount < coupon.getMinPurchaseAmount().doubleValue()) {
            throw new RuntimeException("Số tiền đặt hàng không đạt mức tối thiểu yêu cầu cho phiếu giảm giá này");
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
        
        // Nếu có số lần sử dụng tối đa, cần cập nhật số lần đã sử dụng
        if (coupon.getMaxUses() != null) {
            int usedCount = coupon.getUsedCount() != null ? coupon.getUsedCount() : 0;
            coupon.setUsedCount(usedCount + 1);
            
            // Nếu đã sử dụng đạt tới giới hạn, deactivate coupon
            if (coupon.getMaxUses() <= (usedCount + 1)) {
                coupon.setIsActive(false);
            }
            
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
        int count = deactivateAllExpiredCoupons();
        if (count > 0) {
            System.out.println("Scheduled task: Deactivated " + count + " expired coupons.");
        }
    }
    
    // Tự động chạy hàng ngày lúc 00:01
    @Scheduled(cron = "0 1 0 * * ?")
    @Transactional
    public void scheduledDeactivateExpiredCoupons() {
        try {
            deactivateExpiredCoupons();
        } catch (Exception e) {
            // Log lỗi nhưng không làm fail ứng dụng
            System.err.println("Error while deactivating expired coupons: " + e.getMessage());
            e.printStackTrace();
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

    // Chạy khi ứng dụng khởi động để vô hiệu hóa tất cả phiếu giảm giá quá hạn
    @EventListener(ContextRefreshedEvent.class)
    @Transactional
    public void onApplicationStartup() {
        try {
            System.out.println("Deactivating expired coupons on application startup...");
            int count = deactivateAllExpiredCoupons();
            System.out.println("Deactivated " + count + " expired coupons on startup.");
        } catch (Exception e) {
            System.err.println("Error while deactivating expired coupons on startup: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Phương thức cập nhật để trả về số phiếu giảm giá bị vô hiệu hóa
    @Transactional
    public int deactivateAllExpiredCoupons() {
        LocalDateTime now = LocalDateTime.now();
        int count = 0;
        
        // Tìm tất cả phiếu đang active mà đã quá hạn theo expiryDate
        List<Coupon> expiredCoupons = couponRepository.findByIsActiveAndExpiryDateBefore(true, now);
        for (Coupon coupon : expiredCoupons) {
            coupon.setIsActive(false);
            couponRepository.save(coupon);
            count++;
        }
        
        // Tìm tất cả phiếu đang active mà đã quá hạn theo endDate
        List<Coupon> expiredByEndDate = couponRepository.findByIsActiveAndEndDateBefore(true, now);
        for (Coupon coupon : expiredByEndDate) {
            if (coupon.getIsActive()) { // Tránh đếm trùng lặp
                coupon.setIsActive(false);
                couponRepository.save(coupon);
                count++;
            }
        }
        
        return count;
    }
}