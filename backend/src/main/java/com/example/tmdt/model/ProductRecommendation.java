package com.example.tmdt.model;

import java.time.LocalDateTime;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_recommendations", 
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"product_id", "recommended_product_id", "type"})
    })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommended_product_id", nullable = false)
    private Product recommendedProduct;

    @NotNull
    @Enumerated(EnumType.STRING)
    private RecommendationType type;

    @NotNull
    private Double recommendationScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum RecommendationType {
        BOUGHT_TOGETHER,
        VIEWED_TOGETHER,
        SIMILAR_PRODUCTS,
        RECOMMENDED_FOR_YOU
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