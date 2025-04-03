package com.example.tmdt.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.tmdt.model.Product;
import com.example.tmdt.model.Review;
import com.example.tmdt.model.ReviewHelpful;
import com.example.tmdt.model.ReviewMedia;
import com.example.tmdt.model.User;
import com.example.tmdt.repository.ProductRepository;
import com.example.tmdt.repository.ReviewHelpfulRepository;
import com.example.tmdt.repository.ReviewMediaRepository;
import com.example.tmdt.repository.ReviewRepository;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private ReviewMediaRepository reviewMediaRepository;
    
    @Autowired
    private ReviewHelpfulRepository reviewHelpfulRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @Autowired
    private NotificationService notificationService;
    
    public Page<Review> getProductReviews(Product product, Pageable pageable) {
        return reviewRepository.findByProductOrderByCreatedAtDesc(product, pageable);
    }
    
    public List<Review> getUserReviews(User user) {
        return reviewRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public Review getReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
    }
    
    public Page<Review> getReviewsByRating(Product product, int rating, Pageable pageable) {
        return reviewRepository.findByProductAndRatingOrderByCreatedAtDesc(product, rating, pageable);
    }
    
    public double getAverageRating(Product product) {
        return reviewRepository.calculateAverageRating(product);
    }
    
    public int countReviewsByRating(Product product, int rating) {
        return (int) reviewRepository.countByProductAndRating(product, rating);
    }
    
    @Transactional
    public Review createReview(Review review, List<MultipartFile> mediaFiles) {
        // Kiểm tra xem user đã review sản phẩm này chưa
        if (reviewRepository.existsByUserAndProduct(review.getUser(), review.getProduct())) {
            throw new RuntimeException("You have already reviewed this product");
        }
        
        // Lưu review
        review.setCreatedAt(LocalDateTime.now());
        Review savedReview = reviewRepository.save(review);
        
        // Xử lý media files nếu có
        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            saveReviewMedia(savedReview, mediaFiles);
        }
        
        // Cập nhật rating của sản phẩm
        updateProductRating(review.getProduct());
        
        return savedReview;
    }
    
    @Transactional
    public Review updateReview(Long id, Review updatedReview, List<MultipartFile> newMediaFiles) {
        Review existingReview = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        
        // Kiểm tra xem user có phải là người tạo review không
        if (!existingReview.getUser().equals(updatedReview.getUser())) {
            throw new RuntimeException("You are not authorized to update this review");
        }
        
        // Cập nhật thông tin review
        existingReview.setTitle(updatedReview.getTitle());
        existingReview.setComment(updatedReview.getComment());
        existingReview.setRating(updatedReview.getRating());
        existingReview.setUpdatedAt(LocalDateTime.now());
        
        // Xử lý media files mới nếu có
        if (newMediaFiles != null && !newMediaFiles.isEmpty()) {
            // Xóa media cũ
            reviewMediaRepository.deleteByReview(existingReview);
            
            // Lưu media mới
            saveReviewMedia(existingReview, newMediaFiles);
        }
        
        // Cập nhật rating của sản phẩm
        updateProductRating(existingReview.getProduct());
        
        return reviewRepository.save(existingReview);
    }
    
    @Transactional
    public void deleteReview(Long id, User user) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        
        // Kiểm tra xem user có phải là người tạo review không
        if (!review.getUser().equals(user)) {
            throw new RuntimeException("You are not authorized to delete this review");
        }
        
        // Xóa tất cả media liên quan đến review
        reviewMediaRepository.deleteByReview(review);
        
        // Xóa tất cả helpful votes
        reviewHelpfulRepository.deleteAll(reviewHelpfulRepository.findByReview(review));
        
        // Xóa review
        reviewRepository.delete(review);
        
        // Cập nhật rating của sản phẩm
        updateProductRating(review.getProduct());
    }
    
    private void saveReviewMedia(Review review, List<MultipartFile> mediaFiles) {
        List<ReviewMedia> mediaList = new ArrayList<>();
        
        for (MultipartFile file : mediaFiles) {
            try {
                String fileName = fileStorageService.storeFile(file, "reviews");
                
                ReviewMedia media = new ReviewMedia();
                media.setReview(review);
                media.setFileUrl(fileName);
                
                // Xác định loại media (image hoặc video)
                if (file.getContentType().startsWith("image")) {
                    media.setType("IMAGE");
                } else if (file.getContentType().startsWith("video")) {
                    media.setType("VIDEO");
                } else {
                    media.setType("OTHER");
                }
                
                mediaList.add(media);
            } catch (Exception e) {
                throw new RuntimeException("Failed to store review media files", e);
            }
        }
        
        reviewMediaRepository.saveAll(mediaList);
    }
    
    private void updateProductRating(Product product) {
        double avgRating = reviewRepository.calculateAverageRating(product);
        int reviewCount = (int) reviewRepository.countByProduct(product);
        
        product.setAverageRating(avgRating);
        product.setReviewCount(reviewCount);
        productRepository.save(product);
    }
    
    @Transactional
    public void markReviewHelpful(Long reviewId, User user, boolean isHelpful) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));
        
        // Kiểm tra xem user đã vote cho review này chưa
        ReviewHelpful existing = reviewHelpfulRepository.findByReviewAndUser(review, user).orElse(null);
        
        if (existing != null) {
            // Đã vote rồi, cập nhật vote
            existing.setIsHelpful(isHelpful);
            reviewHelpfulRepository.save(existing);
        } else {
            // Chưa vote, tạo mới
            ReviewHelpful helpful = new ReviewHelpful();
            helpful.setReview(review);
            helpful.setUser(user);
            helpful.setIsHelpful(isHelpful);
            reviewHelpfulRepository.save(helpful);
            
            // Nếu đánh dấu là helpful, gửi thông báo đến người đánh giá
            if (isHelpful) {
                notificationService.createProductNotification(
                    review.getUser(),
                    review.getProduct().getId(),
                    "Someone found your review helpful!"
                );
            }
        }
    }
    
    public int countHelpful(Review review) {
        return (int) reviewHelpfulRepository.countHelpfulByReview(review);
    }
    
    public int countNotHelpful(Review review) {
        return (int) reviewHelpfulRepository.countNotHelpfulByReview(review);
    }
    
    public List<Review> getMostHelpfulReviews(Product product, int limit) {
        return reviewRepository.findMostHelpfulReviews(product, PageRequest.of(0, limit));
    }
    
    public boolean hasUserReviewed(User user, Product product) {
        return reviewRepository.existsByUserAndProduct(user, product);
    }
    
    public List<ReviewMedia> getReviewMedia(Review review) {
        return reviewMediaRepository.findByReview(review);
    }
} 