package com.example.tmdt.controller;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.ArrayList;

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
        
        try {
            Product product = productService.getProduct(productId);
            
            Sort sort = direction.equalsIgnoreCase("asc") ? 
                    Sort.by(sortBy).ascending() : 
                    Sort.by(sortBy).descending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<Review> reviewsPage = reviewService.getProductReviews(product, pageable);
            
            // Convert Page<Review> to a custom response with all necessary user information
            List<Map<String, Object>> reviewResponses = new ArrayList<>();
            
            for (Review review : reviewsPage.getContent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", review.getId());
                response.put("title", review.getTitle());
                response.put("rating", review.getRating());
                response.put("comment", review.getComment());
                response.put("createdAt", review.getCreatedAt());
                response.put("anonymous", review.getAnonymous());
                
                // CRITICAL: Always include userId (regardless of anonymity)
                response.put("userId", review.getUser().getId());
                
                // Include user object
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", review.getUser().getId());
                userInfo.put("username", review.getUser().getUsername());
                userInfo.put("fullName", review.getUser().getFullName());
                response.put("user", userInfo);
                
                // Set display name based on anonymity
                if (review.getAnonymous() == null || !review.getAnonymous()) {
                    response.put("fullName", review.getUser().getFullName());
                    String displayName = (review.getUser().getFullName() != null && !review.getUser().getFullName().isEmpty()) ? 
                        review.getUser().getFullName() : review.getUser().getUsername();
                    response.put("userName", displayName);
                } else {
                    response.put("userName", "Người dùng ẩn danh");
                }
                
                // Count helpful/not helpful votes
                response.put("helpfulCount", reviewService.countHelpful(review));
                response.put("notHelpfulCount", reviewService.countNotHelpful(review));
                
                reviewResponses.add(response);
            }
            
            // Create a response with pagination information
            Map<String, Object> result = new HashMap<>();
            result.put("reviews", reviewResponses);
            result.put("currentPage", reviewsPage.getNumber());
            result.put("totalItems", reviewsPage.getTotalElements());
            result.put("totalPages", reviewsPage.getTotalPages());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserReviews(@AuthenticationPrincipal User user) {
        List<Review> reviews = reviewService.getUserReviews(user);
        
        System.out.println("==== USER REVIEWS FROM DATABASE ====");
        System.out.println("Current user ID: " + user.getId());
        System.out.println("Current user fullName: " + user.getFullName());
        
        // Process the reviews to mark anonymous ones
        List<Object> processedReviews = reviews.stream().map(review -> {
            Map<String, Object> response = new HashMap<>();
            response.put("id", review.getId());
            response.put("title", review.getTitle());
            response.put("rating", review.getRating());
            response.put("comment", review.getComment());
            response.put("productId", review.getProduct().getId());
            response.put("productName", review.getProduct().getName());
            response.put("anonymous", review.getAnonymous());
            response.put("createdAt", review.getCreatedAt());
            response.put("updatedAt", review.getUpdatedAt());
            response.put("date", review.getCreatedAt()); // For frontend compatibility
            response.put("userId", user.getId());
            
            // Include complete user information
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("fullName", user.getFullName());
            
            // Include user object and direct fields
            response.put("user", userInfo);
            response.put("fullName", user.getFullName());
            
            // For the user's own reviews, we still show it's their review but mark it as anonymous if needed
            String displayName = (user.getFullName() != null && !user.getFullName().isEmpty()) ? 
                user.getFullName() : user.getUsername();
            
            response.put("userName", review.getAnonymous() ? "Người dùng ẩn danh (Bạn)" : displayName);
            
            // Add debug log to verify the user name being sent
            System.out.println("Response for review " + review.getId() + ":");
            System.out.println("  fullName set to: " + user.getFullName());
            System.out.println("  userName set to: " + (review.getAnonymous() ? "Người dùng ẩn danh (Bạn)" : displayName));
            
            return response;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(processedReviews);
    }
    
    @GetMapping("/{reviewId}")
    public ResponseEntity<?> getReview(@PathVariable Long reviewId) {
        Review review = reviewService.getReviewById(reviewId);
        
        System.out.println("==== SINGLE REVIEW FROM DATABASE ====");
        System.out.println("Review ID: " + review.getId());
        System.out.println("User ID: " + review.getUser().getId());
        System.out.println("Username: " + review.getUser().getUsername());
        System.out.println("Full Name: " + review.getUser().getFullName());
        System.out.println("Anonymous: " + review.getAnonymous());
        
        // Create a custom response with full user details
        Map<String, Object> response = new HashMap<>();
        response.put("id", review.getId());
        response.put("title", review.getTitle());
        response.put("rating", review.getRating());
        response.put("comment", review.getComment());
        response.put("productId", review.getProduct().getId());
        response.put("anonymous", review.getAnonymous());
        response.put("createdAt", review.getCreatedAt());
        response.put("updatedAt", review.getUpdatedAt());
        response.put("date", review.getCreatedAt()); // For frontend compatibility
        
        // Include user information
        User user = review.getUser();
        response.put("userId", user.getId());
        
        // Build a user info object (luôn cần cho cả review ẩn danh và không ẩn danh)
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("fullName", user.getFullName());
        
        // Luôn đính kèm user object (cần thiết để frontend xác định chủ sở hữu)
        response.put("user", userInfo);
        
        // Thông tin hiển thị tùy thuộc vào tính ẩn danh
        if (review.getAnonymous() == null || !review.getAnonymous()) {
            response.put("fullName", user.getFullName());
            
            // Set userName to full name or username
            String displayName = (user.getFullName() != null && !user.getFullName().isEmpty()) ? 
                user.getFullName() : user.getUsername();
            response.put("userName", displayName);
        } else {
            response.put("userName", "Người dùng ẩn danh");
        }
        
        return ResponseEntity.ok(response);
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
        
        try {
            Product product = productService.getProduct(productId);
            List<Review> reviews = reviewService.getMostHelpfulReviews(product, limit);
            
            // Convert List<Review> to a custom response with all necessary user information
            List<Map<String, Object>> reviewResponses = new ArrayList<>();
            
            for (Review review : reviews) {
                Map<String, Object> response = new HashMap<>();
                response.put("id", review.getId());
                response.put("title", review.getTitle());
                response.put("rating", review.getRating());
                response.put("comment", review.getComment());
                response.put("createdAt", review.getCreatedAt());
                response.put("anonymous", review.getAnonymous());
                
                // CRITICAL: Always include userId (regardless of anonymity)
                response.put("userId", review.getUser().getId());
                
                // Include user object
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", review.getUser().getId());
                userInfo.put("username", review.getUser().getUsername());
                userInfo.put("fullName", review.getUser().getFullName());
                response.put("user", userInfo);
                
                // Set display name based on anonymity
                if (review.getAnonymous() == null || !review.getAnonymous()) {
                    response.put("fullName", review.getUser().getFullName());
                    String displayName = (review.getUser().getFullName() != null && !review.getUser().getFullName().isEmpty()) ? 
                        review.getUser().getFullName() : review.getUser().getUsername();
                    response.put("userName", displayName);
                } else {
                    response.put("userName", "Người dùng ẩn danh");
                }
                
                // Count helpful/not helpful votes
                response.put("helpfulCount", reviewService.countHelpful(review));
                response.put("notHelpfulCount", reviewService.countNotHelpful(review));
                
                reviewResponses.add(response);
            }
            
            return ResponseEntity.ok(reviewResponses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
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
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String comment,
            @RequestParam int rating) {
        
        try {
            Product product = productService.getProduct(productId);
            
            Review review = new Review();
            review.setProduct(product);
            review.setUser(user);
            review.setTitle(title);
            review.setComment(comment);
            review.setRating(Double.valueOf(rating));
            review.setAnonymous(false); // Default to not anonymous
            
            Review savedReview = reviewService.createReview(review);
            
            // Create a response with all necessary user information
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedReview.getId());
            response.put("title", savedReview.getTitle());
            response.put("rating", savedReview.getRating());
            response.put("comment", savedReview.getComment());
            response.put("productId", savedReview.getProduct().getId());
            response.put("anonymous", savedReview.getAnonymous());
            response.put("createdAt", savedReview.getCreatedAt());
            
            // CRITICAL: Always include userId (regardless of anonymity)
            response.put("userId", user.getId());
            
            // Include complete user object
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("fullName", user.getFullName());
            response.put("user", userInfo);
            
            // Set display name based on anonymity setting
            if (!savedReview.getAnonymous()) {
                response.put("fullName", user.getFullName());
                response.put("userName", user.getFullName() != null ? user.getFullName() : user.getUsername());
            } else {
                response.put("userName", "Người dùng ẩn danh");
            }
            
            // Debugging
            System.out.println("Review response: " + response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/{reviewId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String comment,
            @RequestParam int rating) {
        
        try {
            // Tạo review mới với thông tin cập nhật
            Review updatedReview = new Review();
            updatedReview.setUser(user);
            updatedReview.setTitle(title);
            updatedReview.setComment(comment);
            updatedReview.setRating(Double.valueOf(rating));
            
            Review result = reviewService.updateReview(reviewId, updatedReview);
            
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
    
    // New endpoint for simplified review creation (only rating required)
    @PostMapping("/product/{productId}/simple")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createSimpleReview(
            @PathVariable Long productId,
            @AuthenticationPrincipal User user,
            @RequestParam int rating,
            @RequestParam(required = false) String comment,
            @RequestParam(required = false, defaultValue = "false") boolean isAnonymous) {
        
        try {
            Product product = productService.getProduct(productId);
            
            Review review = new Review();
            review.setProduct(product);
            review.setUser(user);
            review.setRating(Double.valueOf(rating));
            review.setAnonymous(isAnonymous);
            
            // Comment is optional
            if (comment != null && !comment.trim().isEmpty()) {
                review.setComment(comment);
            }
            
            Review savedReview = reviewService.createReview(review);
            
            // Create a response with all necessary user information
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedReview.getId());
            response.put("title", savedReview.getTitle());
            response.put("rating", savedReview.getRating());
            response.put("comment", savedReview.getComment());
            response.put("productId", savedReview.getProduct().getId());
            response.put("anonymous", savedReview.getAnonymous());
            response.put("createdAt", savedReview.getCreatedAt());
            
            // CRITICAL: Always include userId (regardless of anonymity)
            response.put("userId", user.getId());
            
            // Include complete user object
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("username", user.getUsername());
            userInfo.put("fullName", user.getFullName());
            response.put("user", userInfo);
            
            // Set display name based on anonymity
            if (!isAnonymous) {
                response.put("fullName", user.getFullName());
                response.put("userName", user.getFullName() != null ? user.getFullName() : user.getUsername());
            } else {
                response.put("userName", "Người dùng ẩn danh");
            }
            
            // Debugging
            System.out.println("Simple review response: " + response);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
} 