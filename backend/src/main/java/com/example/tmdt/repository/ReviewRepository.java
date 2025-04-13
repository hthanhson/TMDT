package com.example.tmdt.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.Product;
import com.example.tmdt.model.Review;
import com.example.tmdt.model.User;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct(Product product);
    
    List<Review> findByUser(User user);
    
    List<Review> findByUserOrderByCreatedAtDesc(User user);
    
    Page<Review> findByProductOrderByCreatedAtDesc(Product product, Pageable pageable);
    
    Page<Review> findByProductAndRatingOrderByCreatedAtDesc(Product product, int rating, Pageable pageable);
    
    boolean existsByUserAndProduct(User user, Product product);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product = :product")
    long countByProduct(@Param("product") Product product);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.product = :product AND r.rating = :rating")
    long countByProductAndRating(@Param("product") Product product, @Param("rating") int rating);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product = :product")
    Double calculateAverageRating(@Param("product") Product product);
    
    @Query("SELECT r FROM Review r WHERE r.product = :product ORDER BY SIZE(r.reviewHelpfuls) DESC")
    List<Review> findMostHelpfulReviews(@Param("product") Product product, Pageable pageable);
    
    /**
     * Tìm tất cả các đánh giá của một người dùng cho một sản phẩm cụ thể, sắp xếp theo thời gian tạo giảm dần
     */
    List<Review> findByUserAndProductOrderByCreatedAtDesc(User user, Product product);
} 