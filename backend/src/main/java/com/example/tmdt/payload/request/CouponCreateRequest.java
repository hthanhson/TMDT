package com.example.tmdt.payload.request;

import com.example.tmdt.model.Coupon.DiscountType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CouponCreateRequest {
    private String code;
    private String description;
    private DiscountType discountType;
    private Double discountValue;
    private Double minPurchaseAmount;
    private Integer maxUses;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private boolean isActive = true;
    private String type;
    private Long userId;
} 