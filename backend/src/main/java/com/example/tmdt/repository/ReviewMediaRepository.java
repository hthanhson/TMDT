package com.example.tmdt.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.Review;
import com.example.tmdt.model.ReviewMedia;

@Repository
public interface ReviewMediaRepository extends JpaRepository<ReviewMedia, Long> {
    
    List<ReviewMedia> findByReview(Review review);
    
    void deleteByReview(Review review);
} 