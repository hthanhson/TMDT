package com.example.tmdt.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.tmdt.model.Product;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Wishlist;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.payload.response.ProductResponse;
import com.example.tmdt.service.UserService;
import com.example.tmdt.service.WishlistService;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {
    private static final Logger logger = LoggerFactory.getLogger(WishlistController.class);
    
    @Autowired
    private WishlistService wishlistService;
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getWishlist(@AuthenticationPrincipal User user) {
        logger.info("Get wishlist request for user: {}", user != null ? user.getId() : "null");
        if (user == null) {
            logger.error("User is null when getting wishlist");
            return ResponseEntity.badRequest().body(new MessageResponse("User must be authenticated to view wishlist"));
        }
        
        List<Product> products = wishlistService.getWishlistProductsByUser(user);
        
        List<ProductResponse> productResponses = products.stream()
                .map(product -> new ProductResponse(product))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(productResponses);
    }
    
    @PostMapping("/{productId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> addToWishlist(
            @AuthenticationPrincipal User user,
            @PathVariable Long productId) {
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            logger.info("Authentication: principal={}, authorities={}", 
                auth.getPrincipal(), auth.getAuthorities());
        } else {
            logger.error("No Authentication in SecurityContext");
        }
        
        logger.info("Add to wishlist request: user={}, productId={}", user != null ? user.getId() : "null", productId);
        if (user == null) {
            logger.error("User is null when adding to wishlist");
            return ResponseEntity.badRequest().body(new MessageResponse("User must be authenticated to add to wishlist"));
        }
        
        try {
            Wishlist wishlist = wishlistService.addToWishlist(user, productId);
            return ResponseEntity.ok(new MessageResponse("Product added to wishlist successfully"));
        } catch (Exception e) {
            logger.error("Error adding product to wishlist", e);
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{productId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> removeFromWishlist(
            @AuthenticationPrincipal User user,
            @PathVariable Long productId) {
        
        logger.info("Remove from wishlist request: user={}, productId={}", user != null ? user.getId() : "null", productId);
        if (user == null) {
            logger.error("User is null when removing from wishlist");
            return ResponseEntity.badRequest().body(new MessageResponse("User must be authenticated to remove from wishlist"));
        }
        
        try {
            wishlistService.removeFromWishlist(user, productId);
            return ResponseEntity.ok(new MessageResponse("Product removed from wishlist successfully"));
        } catch (Exception e) {
            logger.error("Error removing product from wishlist", e);
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @DeleteMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> clearWishlist(@AuthenticationPrincipal User user) {
        logger.info("Clear wishlist request for user: {}", user != null ? user.getId() : "null");
        if (user == null) {
            logger.error("User is null when clearing wishlist");
            return ResponseEntity.badRequest().body(new MessageResponse("User must be authenticated to clear wishlist"));
        }
        
        wishlistService.clearWishlist(user);
        return ResponseEntity.ok(new MessageResponse("Wishlist cleared successfully"));
    }
    
    @GetMapping("/check/{productId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> checkInWishlist(
            @AuthenticationPrincipal User user,
            @PathVariable Long productId) {
        
        logger.info("Check in wishlist request: user={}, productId={}", user != null ? user.getId() : "null", productId);
        if (user == null) {
            logger.error("User is null when checking wishlist");
            return ResponseEntity.ok(false);
        }
        
        boolean isInWishlist = wishlistService.isInWishlist(user, productId);
        return ResponseEntity.ok(isInWishlist);
    }
} 