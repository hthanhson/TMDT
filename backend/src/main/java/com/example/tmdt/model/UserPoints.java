package com.example.tmdt.model;

import java.time.LocalDateTime;

import javax.persistence.*;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_points")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPoints {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @NotNull
    @Min(0)
    @Column(name = "current_points")
    private Integer currentPoints = 0;

    @NotNull
    @Min(0)
    @Column(name = "total_earned_points")
    private Integer totalEarnedPoints = 0;

    @NotNull
    @Min(0)
    @Column(name = "total_spent_points")
    private Integer totalSpentPoints = 0;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "loyalty_tier")
    private LoyaltyTier loyaltyTier = LoyaltyTier.BRONZE;

    @Column(name = "last_points_earned_date")
    private LocalDateTime lastPointsEarnedDate;

    @Column(name = "last_points_spent_date")
    private LocalDateTime lastPointsSpentDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum LoyaltyTier {
        BRONZE,
        SILVER,
        GOLD,
        PLATINUM
    }

    public void addPoints(int points) {
        if (points > 0) {
            this.currentPoints += points;
            this.totalEarnedPoints += points;
            this.lastPointsEarnedDate = LocalDateTime.now();
            updateLoyaltyTier();
        }
    }

    public boolean spendPoints(int points) {
        if (points > 0 && this.currentPoints >= points) {
            this.currentPoints -= points;
            this.totalSpentPoints += points;
            this.lastPointsSpentDate = LocalDateTime.now();
            return true;
        }
        return false;
    }

    private void updateLoyaltyTier() {
        if (totalEarnedPoints >= 10000) {
            this.loyaltyTier = LoyaltyTier.PLATINUM;
        } else if (totalEarnedPoints >= 5000) {
            this.loyaltyTier = LoyaltyTier.GOLD;
        } else if (totalEarnedPoints >= 1000) {
            this.loyaltyTier = LoyaltyTier.SILVER;
        } else {
            this.loyaltyTier = LoyaltyTier.BRONZE;
        }
    }

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