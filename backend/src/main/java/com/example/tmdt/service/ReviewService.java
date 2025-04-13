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
import com.example.tmdt.model.User;
import com.example.tmdt.repository.ProductRepository;
import com.example.tmdt.repository.ReviewHelpfulRepository;
import com.example.tmdt.repository.ReviewRepository;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private ReviewHelpfulRepository reviewHelpfulRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @Autowired
    private NotificationService notificationService;
    
    public Page<Review> getProductReviews(Product product, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByProductOrderByCreatedAtDesc(product, pageable);
        
        // Đảm bảo mỗi review đều có thông tin user đầy đủ
        for (Review review : reviews.getContent()) {
            if (review.getUser() != null) {
                // Force initialize user để tránh lỗi lazy loading
                User user = review.getUser();
                user.getId(); // Gọi getter để đảm bảo dữ liệu được load
                if (user.getUsername() != null) {
                    user.getUsername(); // Gọi getter để đảm bảo dữ liệu được load
                }
                if (user.getFullName() != null) {
                    user.getFullName(); // Gọi getter để đảm bảo dữ liệu được load
                }
            }
        }
        
        return reviews;
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
    public Review createReview(Review review) {
        // Đảm bảo user được set đúng
        if (review.getUser() == null) {
            throw new RuntimeException("User is required for review");
        }
        
        // Đảm bảo product được set đúng
        if (review.getProduct() == null) {
            throw new RuntimeException("Product is required for review");
        }
        
        // Đảm bảo dữ liệu review hợp lệ
        if (review.getRating() == null || review.getRating() < 1 || review.getRating() > 5) {
            throw new RuntimeException("Valid rating (1-5) is required");
        }
        
        // Lưu review
        review.setCreatedAt(LocalDateTime.now());
        Review savedReview = reviewRepository.save(review);
        
        // Đảm bảo rằng tham chiếu user trong review đã được load đầy đủ
        if (savedReview.getUser() != null) {
            // Force initialize user để tránh lỗi lazy loading
            savedReview.getUser().getId();
            savedReview.getUser().getUsername();
            if (savedReview.getUser().getFullName() != null) {
                savedReview.getUser().getFullName();
            }
        }
        
        // Cập nhật rating của sản phẩm
        updateProductRating(review.getProduct());
        
        return savedReview;
    }
    
    @Transactional
    public Review updateReview(Long id, Review updatedReview) {
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
        
        // Cập nhật rating của sản phẩm
        updateProductRating(existingReview.getProduct());
        
        return reviewRepository.save(existingReview);
    }
    
    @Transactional
    public void deleteReview(Long id, User user) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        
        // Kiểm tra xem user có phải là người tạo review không
        if (!review.getUser().equals(user) && !isAdmin(user)) {
            throw new RuntimeException("You are not authorized to delete this review");
        }
        
        Product product = review.getProduct();
        
        try {
            // Xóa tất cả helpful votes
            reviewHelpfulRepository.deleteAll(reviewHelpfulRepository.findByReview(review));
            
            // Xóa review
            reviewRepository.delete(review);
            
            // Cập nhật rating của sản phẩm
            updateProductRating(product);
            
            System.out.println("Review with ID " + id + " was successfully deleted by user " + user.getUsername());
        } catch (Exception e) {
            System.err.println("Error deleting review: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete review: " + e.getMessage());
        }
    }
    
    private boolean isAdmin(User user) {
        return user.getRoles().stream()
                .anyMatch(role -> role.getName().name().equals("ROLE_ADMIN"));
    }
    
    private void updateProductRating(Product product) {
        Double avgRatingObj = reviewRepository.calculateAverageRating(product);
        double avgRating = avgRatingObj != null ? avgRatingObj : 0.0;
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
        List<Review> reviews = reviewRepository.findMostHelpfulReviews(product, PageRequest.of(0, limit));
        
        // Đảm bảo mỗi review đều có thông tin user đầy đủ
        for (Review review : reviews) {
            if (review.getUser() != null) {
                // Force initialize user để tránh lỗi lazy loading
                User user = review.getUser();
                user.getId();
                if (user.getUsername() != null) {
                    user.getUsername();
                }
                if (user.getFullName() != null) {
                    user.getFullName();
                }
            }
        }
        
        return reviews;
    }
    
    public boolean hasUserReviewed(User user, Product product) {
        return reviewRepository.existsByUserAndProduct(user, product);
    }
    
    /**
     * Lấy tất cả các đánh giá của một người dùng cho một sản phẩm cụ thể
     * 
     * @param user Người dùng cần lấy đánh giá
     * @param product Sản phẩm cần lấy đánh giá
     * @return Danh sách các đánh giá của người dùng cho sản phẩm
     */
    public List<Review> getUserReviewsForProduct(User user, Product product) {
        return reviewRepository.findByUserAndProductOrderByCreatedAtDesc(user, product);
    }
} 