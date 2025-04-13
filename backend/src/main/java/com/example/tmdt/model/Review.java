package com.example.tmdt.model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import javax.persistence.*;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"product", "user", "reviewHelpfuls"})
@EqualsAndHashCode(exclude = {"product", "user", "reviewHelpfuls"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100)
    private String title;

    @NotNull
    @Min(1)
    @Max(5)
    private Double rating;

    @Column(length = 500)
    private String comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnoreProperties("reviews")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"reviews", "hibernateLazyInitializer", "handler"})
    private User user;

    @Column(name = "anonymous", nullable = false)
    private Boolean anonymous = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<ReviewHelpful> reviewHelpfuls = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        
        if (title == null || title.trim().isEmpty()) {
            if (rating != null) {
                if (rating >= 4) {
                    title = "Đánh giá tích cực";
                } else if (rating >= 2) {
                    title = "Đánh giá trung bình";
                } else {
                    title = "Đánh giá tiêu cực";
                }
            } else {
                title = "Đánh giá sản phẩm";
            }
        }
        
        if (comment == null || comment.trim().isEmpty()) {
            if (rating != null) {
                if (rating >= 4) {
                    comment = "Tôi rất hài lòng với sản phẩm này.";
                } else if (rating >= 2) {
                    comment = "Sản phẩm này khá ổn.";
                } else {
                    comment = "Tôi không hài lòng với sản phẩm này.";
                }
            } else {
                comment = "Không có nhận xét.";
            }
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 