package com.example.tmdt.model;

import java.time.LocalDateTime;

import javax.persistence.*;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "loyalty_tiers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyTier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private String description;

    @NotNull
    @Min(0)
    @Column(name = "point_threshold")
    private Integer pointThreshold;

    @NotNull
    @Min(0)
    @Column(name = "discount_percentage")
    private Double discountPercentage;

    @NotNull
    @Min(0)
    @Column(name = "points_multiplier")
    private Double pointsMultiplier = 1.0;

    @Column(name = "special_benefits")
    private String specialBenefits;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 