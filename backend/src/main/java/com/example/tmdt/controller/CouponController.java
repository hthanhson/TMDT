package com.example.tmdt.controller;

import com.example.tmdt.model.Coupon;
import com.example.tmdt.model.User;
import com.example.tmdt.payload.request.CouponCreateRequest;
import com.example.tmdt.payload.request.CouponVerifyRequest;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.service.CouponService;
import com.example.tmdt.service.UserService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/coupons")
public class CouponController {
    private static final Logger logger = LoggerFactory.getLogger(CouponController.class);

    @Autowired
    private CouponService couponService;

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        logger.info("Getting all coupons");
        return ResponseEntity.ok(couponService.getAllCoupons());
    }

    @GetMapping("/valid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Coupon>> getAllValidCoupons() {
        logger.info("Getting all valid coupons");
        return ResponseEntity.ok(couponService.getAllActiveCoupons());
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Coupon>> getActiveCoupons() {
        logger.info("Getting all active coupons");
        return ResponseEntity.ok(couponService.getAllActiveCoupons());
    }

    @GetMapping("/my-coupons")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Coupon>> getMyCoupons(@AuthenticationPrincipal User user) {
        if (user == null) {
            logger.error("User is null when getting coupons");
            return ResponseEntity.badRequest().build();
        }
        logger.info("Getting coupons for user: {}", user.getId());
        return ResponseEntity.ok(couponService.getActiveCouponsByUser(user));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Coupon> createCoupon(@RequestBody CouponCreateRequest request) {
        logger.info("Creating new coupon: {}", request.getCode());
        
        Coupon coupon = new Coupon();
        coupon.setCode(request.getCode());
        coupon.setDescription(request.getDescription());
        coupon.setDiscountType(request.getDiscountType());
        coupon.setDiscountValue(BigDecimal.valueOf(request.getDiscountValue()));
        coupon.setMinPurchaseAmount(BigDecimal.valueOf(request.getMinPurchaseAmount()));
//        coupon.setMaxUses(request.getMaxUses());
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setExpiryDate(request.getEndDate());
        coupon.setIsActive(true);
        coupon.setType(request.getType());
        
        // Nếu coupon dành riêng cho 1 người dùng
        List<User> userCoupons=request.getUsers();
        if (userCoupons!= null && !userCoupons.isEmpty()) {
            for (User users : userCoupons) {
                User user = userService.getUserById(users.getId());
                coupon.getUsers().add(user);
            }

        }
        
        Coupon savedCoupon = couponService.createCoupon(coupon);
        return ResponseEntity.ok(savedCoupon);
    }

    @PostMapping("/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignCouponToUser(
            @RequestParam("userId") Long userId,
            @RequestParam("discountAmount") Double discountAmount,
            @RequestParam("minOrderValue") Double minOrderValue,
            @RequestParam("expiryDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime expiryDate,
            @RequestParam("type") String type,
            @RequestParam("description") String description) {
        
        User user = userService.getUserById(userId);
        if (user == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }
        
        logger.info("Assigning coupon to user: {}", user.getId());
        Coupon coupon = couponService.createUserCoupon(
                user, discountAmount, minOrderValue, expiryDate, type, description);
        
        return ResponseEntity.ok(coupon);
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> verifyCoupon(
            @AuthenticationPrincipal User user,
            @RequestBody CouponVerifyRequest request) {
        
        if (user == null) {
            logger.error("User is null when verifying coupon");
            return ResponseEntity.badRequest().body(new MessageResponse("User must be authenticated"));
        }
        
        logger.info("Verifying coupon: {} for user: {}", request.getCode(), user.getId());
        try {
            Coupon coupon = couponService.verifyCoupon(request.getCode(), user, request.getOrderAmount());
            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("coupon", coupon);
            response.put("message", "Coupon is valid");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            logger.error("Error verifying coupon: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateCoupon(
            @PathVariable Long id,
            @RequestBody CouponCreateRequest request) {
        
        logger.info("Updating coupon: {}", id);
        try {
            Coupon existingCoupon = couponService.getCouponById(id);
            existingCoupon.setDescription(request.getDescription());
            existingCoupon.setDiscountType(request.getDiscountType());
            existingCoupon.setDiscountValue(BigDecimal.valueOf(request.getDiscountValue()));
            existingCoupon.setMinPurchaseAmount(BigDecimal.valueOf(request.getMinPurchaseAmount()));
//            existingCoupon.setMaxUses(request.getMaxUses());
            existingCoupon.setStartDate(request.getStartDate());
            existingCoupon.setEndDate(request.getEndDate());
            existingCoupon.setExpiryDate(request.getEndDate());
            existingCoupon.setIsActive(request.isActive());
            
            // Chỉ có thể thay đổi mã nếu mã mới hợp lệ và chưa tồn tại
            if (request.getCode() != null && !request.getCode().isEmpty() 
                    && !request.getCode().equals(existingCoupon.getCode())) {
                existingCoupon.setCode(request.getCode());
            }
            
            Coupon updatedCoupon = couponService.updateCoupon(existingCoupon);
            return ResponseEntity.ok(updatedCoupon);
        } catch (Exception e) {
            logger.error("Error updating coupon: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteCoupon(@PathVariable Long id) {
        logger.info("Deactivating coupon: {}", id);
        try {
            couponService.deactivateCouponById(id);
            return ResponseEntity.ok(new MessageResponse("Coupon deactivated successfully"));
        } catch (Exception e) {
            logger.error("Error deactivating coupon: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/deactivate-expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deactivateExpiredCoupons() {
        logger.info("Admin requesting deactivation of all expired coupons");
        try {
            int count = couponService.deactivateAllExpiredCoupons();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Successfully deactivated " + count + " expired coupons");
            response.put("deactivatedCount", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error deactivating expired coupons: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error deactivating expired coupons: " + e.getMessage()));
        }
    }
}