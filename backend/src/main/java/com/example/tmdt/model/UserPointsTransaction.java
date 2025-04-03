package com.example.tmdt.model;

import java.time.LocalDateTime;

import javax.persistence.*;
import javax.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_points_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPointsTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @Column(nullable = false)
    private Integer points;

    @NotNull
    @Column(nullable = false)
    private String type; // EARNED, SPENT, EXPIRED, ADJUSTED, etc.

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "reference_id")
    private Long referenceId; // ID của đơn hàng, coupon, hoặc các tham chiếu khác

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 