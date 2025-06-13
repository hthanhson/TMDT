package com.example.tmdt.payload.request;

import com.example.tmdt.model.Coupon.DiscountType;
import com.example.tmdt.model.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

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
    private List<User> users;
} 