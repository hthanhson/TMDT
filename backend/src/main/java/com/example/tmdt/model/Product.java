package com.example.tmdt.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.persistence.*;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"images", "reviews"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@EqualsAndHashCode(exclude = {"images", "reviews", "category"})
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Double price;

    @NotNull
    @Min(0)
    @Column(nullable = false)
    private Integer stock;

    @Column(name = "image_url")
    private String imageUrl;

//    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
//    @JsonIgnoreProperties("product")
//    private Set<ProductImage> images = new HashSet<>();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties({"products", "parent", "subCategories"})
    private Category category;

    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @Column(name = "review_count")
    private Integer reviewCount = 0;

    @Column(name = "sold_count")
    private Integer soldCount = 0;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Column(name = "discount_percentage")
    private Double discountPercentage = 0.0;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties("product")
    private List<Review> reviews = new ArrayList<>();

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

//    public void addImage(ProductImage image) {
//        images.add(image);
//        image.setProduct(this);
//    }
//
//    public void removeImage(ProductImage image) {
//        images.remove(image);
//        image.setProduct(null);
//    }

    public void addReview(Review review) {
        reviews.add(review);
        updateRating();
    }

    public void removeReview(Review review) {
        reviews.remove(review);
        updateRating();
    }

    public void updateRating() {
        if (reviews.isEmpty()) {
            this.averageRating = 0.0;
        } else {
            double sum = 0.0;
            for (Review review : reviews) {
                sum += review.getRating();
            }
            this.averageRating = sum / reviews.size();
        }
        this.reviewCount = reviews.size();
    }

    public Double getDiscountedPrice() {
        if (discountPercentage != null && discountPercentage > 0) {
            return price * (1 - discountPercentage / 100);
        }
        return price;
    }
}