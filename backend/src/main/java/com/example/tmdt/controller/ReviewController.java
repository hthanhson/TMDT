package com.example.tmdt.controller;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.tmdt.model.Product;
import com.example.tmdt.model.Review;
import com.example.tmdt.model.ReviewMedia;
import com.example.tmdt.model.User;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.service.ProductService;
import com.example.tmdt.service.ReviewService;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private ProductService productService;
    
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        Product product = productService.getProduct(productId);
        
        Sort sort = direction.equalsIgnoreCase("asc") ? 
                Sort.by(sortBy).ascending() : 
                Sort.by(sortBy).descending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Review> reviews = reviewService.getProductReviews(product, pageable);
        
        return ResponseEntity.ok(reviews);
    }
    
    @GetMapping("/user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserReviews(@AuthenticationPrincipal User user) {
        List<Review> reviews = reviewService.getUserReviews(user);
        return ResponseEntity.ok(reviews);
    }
    
    @GetMapping("/{reviewId}")
    public ResponseEntity<?> getReview(@PathVariable Long reviewId) {
        Review review = reviewService.getReviewById(reviewId);
        return ResponseEntity.ok(review);
    }
    
    @GetMapping("/product/{productId}/rating/{rating}")
    public ResponseEntity<?> getReviewsByRating(
            @PathVariable Long productId,
            @PathVariable int rating,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Product product = productService.getProduct(productId);
        Pageable pageable = PageRequest.of(page, size);
        
        Page<Review> reviews = reviewService.getReviewsByRating(product, rating, pageable);
        return ResponseEntity.ok(reviews);
    }
    
    @GetMapping("/product/{productId}/helpful")
    public ResponseEntity<?> getMostHelpfulReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "5") int limit) {
        
        Product product = productService.getProduct(productId);
        List<Review> reviews = reviewService.getMostHelpfulReviews(product, limit);
        
        return ResponseEntity.ok(reviews);
    }
    
    @GetMapping("/product/{productId}/summary")
    public ResponseEntity<?> getProductReviewSummary(@PathVariable Long productId) {
        Product product = productService.getProduct(productId);
        
        double averageRating = reviewService.getAverageRating(product);
        int totalReviews = product.getReviewCount();
        
        // Tính phân bố đánh giá theo thang điểm
        int[] ratingCounts = new int[5];
        for (int i = 1; i <= 5; i++) {
            ratingCounts[i-1] = reviewService.countReviewsByRating(product, i);
        }
        
        // Tạo đối tượng để trả về
        Map<String, Object> summary = new HashMap<>();
        summary.put("averageRating", averageRating);
        summary.put("totalReviews", totalReviews);
        summary.put("ratingCounts", ratingCounts);
        
        return ResponseEntity.ok(summary);
    }
    
    @PostMapping("/product/{productId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal User user,
            @RequestParam String title,
            @RequestParam String comment,
            @RequestParam int rating,
            @RequestPart(required = false) List<MultipartFile> media) {
        
        try {
            Product product = productService.getProduct(productId);
            
            // Kiểm tra xem user đã review sản phẩm này chưa
            if (reviewService.hasUserReviewed(user, product)) {
                return ResponseEntity.badRequest().body(new MessageResponse("You have already reviewed this product"));
            }
            
            Review review = new Review();
            review.setProduct(product);
            review.setUser(user);
            review.setTitle(title);
            review.setComment(comment);
            review.setRating(Double.valueOf(rating));
            
            Review savedReview = reviewService.createReview(review, media);
            
            return ResponseEntity.ok(savedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{reviewId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal User user,
            @RequestParam String title,
            @RequestParam String comment,
            @RequestParam int rating,
            @RequestPart(required = false) List<MultipartFile> media) {
        
        try {
            // Tạo review mới với thông tin cập nhật
            Review updatedReview = new Review();
            updatedReview.setUser(user);
            updatedReview.setTitle(title);
            updatedReview.setComment(comment);
            updatedReview.setRating(Double.valueOf(rating));
            
            Review result = reviewService.updateReview(reviewId, updatedReview, media);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal User user) {
        
        try {
            reviewService.deleteReview(reviewId, user);
            return ResponseEntity.ok(new MessageResponse("Review deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/{reviewId}/media")
    public ResponseEntity<?> getReviewMedia(@PathVariable Long reviewId) {
        Review review = reviewService.getReviewById(reviewId);
        List<ReviewMedia> media = reviewService.getReviewMedia(review);
        
        return ResponseEntity.ok(media);
    }
    
    @PostMapping("/{reviewId}/helpful")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> markReviewHelpful(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal User user,
            @RequestParam boolean isHelpful) {
        
        try {
            reviewService.markReviewHelpful(reviewId, user, isHelpful);
            
            String message = isHelpful ? 
                    "Review marked as helpful" : 
                    "Review marked as not helpful";
            
            return ResponseEntity.ok(new MessageResponse(message));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/check/{productId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> checkUserReviewed(
            @PathVariable Long productId,
            @AuthenticationPrincipal User user) {
        
        Product product = productService.getProduct(productId);
        boolean hasReviewed = reviewService.hasUserReviewed(user, product);
        
        return ResponseEntity.ok(hasReviewed);
    }
} 