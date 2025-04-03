package com.example.tmdt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.Review;
import com.example.tmdt.model.ReviewHelpful;
import com.example.tmdt.model.User;

@Repository
public interface ReviewHelpfulRepository extends JpaRepository<ReviewHelpful, Long> {
    
    List<ReviewHelpful> findByReview(Review review);
    
    Optional<ReviewHelpful> findByReviewAndUser(Review review, User user);
    
    @Query("SELECT COUNT(rh) FROM ReviewHelpful rh WHERE rh.review = ?1 AND rh.isHelpful = true")
    long countHelpfulByReview(Review review);
    
    @Query("SELECT COUNT(rh) FROM ReviewHelpful rh WHERE rh.review = ?1 AND rh.isHelpful = false")
    long countNotHelpfulByReview(Review review);
    
    boolean existsByReviewAndUser(Review review, User user);
} 