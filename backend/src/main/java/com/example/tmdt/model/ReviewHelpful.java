package com.example.tmdt.model;

import java.time.LocalDateTime;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "review_helpful")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"review", "user"})
@EqualsAndHashCode(exclude = {"review", "user"})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ReviewHelpful {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    @JsonIgnoreProperties({"reviewHelpfuls", "product", "user"})
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"reviews", "orders", "cart"})
    private User user;

    @Column(name = "is_helpful")
    private boolean isHelpful;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getter and setter for isHelpful
    public boolean isHelpful() {
        return isHelpful;
    }
    
    public void setIsHelpful(boolean isHelpful) {
        this.isHelpful = isHelpful;
    }
    
    public void setHelpful(boolean isHelpful) {
        this.isHelpful = isHelpful;
    }
} 