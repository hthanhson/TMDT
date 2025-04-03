package com.example.tmdt.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import javax.persistence.*;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "coupons")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(unique = true, nullable = false)
    private String code;

    @NotBlank
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType;

    @NotNull
    @Min(0)
    private BigDecimal discountValue;

    @NotNull
    @Min(0)
    @Column(name = "min_purchase_amount")
    private BigDecimal minPurchaseAmount;

    @NotNull
    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "used_count")
    private Integer usedCount = 0;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;

    public enum DiscountType {
        PERCENTAGE,
        FIXED_AMOUNT
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (expiryDate == null) {
            expiryDate = endDate;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && 
               now.isAfter(startDate) && 
               now.isBefore(endDate) &&
               (maxUses == null || usedCount < maxUses);
    }
    
    // Additional methods for CouponService
    public boolean getIsActive() {
        return isActive;
    }
    
    public LocalDateTime getExpiryDate() {
        return expiryDate != null ? expiryDate : endDate;
    }
    
    public double getDiscountAmount() {
        return discountValue.doubleValue();
    }
    
    public double getMinOrderValue() {
        return minPurchaseAmount.doubleValue();
    }

    public void setIsActive(boolean isActive) {
        this.isActive = isActive;
    }
} 