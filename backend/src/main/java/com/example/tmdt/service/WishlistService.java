package com.example.tmdt.service;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.tmdt.model.Notification;
import com.example.tmdt.model.Product;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Wishlist;
import com.example.tmdt.repository.NotificationRepository;
import com.example.tmdt.repository.ProductRepository;
import com.example.tmdt.repository.UserRepository;
import com.example.tmdt.repository.WishlistRepository;

@Service
public class WishlistService {
    private static final Logger logger = LoggerFactory.getLogger(WishlistService.class);

    @Autowired
    private WishlistRepository wishlistRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    public List<Wishlist> getWishlistByUser(User user) {
        return wishlistRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public List<Product> getWishlistProductsByUser(User user) {
        return wishlistRepository.findByUser(user).stream()
                .map(Wishlist::getProduct)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public Wishlist addToWishlist(User user, Long productId) {
        logger.info("Adding product {} to wishlist for user {}", productId, user);
        if (user == null) {
            logger.error("User is null when adding to wishlist");
            throw new RuntimeException("User must be authenticated to add to wishlist");
        }
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        if (wishlistRepository.existsByUserAndProduct(user, product)) {
            logger.info("Product {} already exists in wishlist for user {}", productId, user.getId());
            throw new RuntimeException("Product already exists in wishlist");
        }
        
        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setProduct(product);
        
        logger.info("Saving wishlist entry: user={}, product={}", user.getId(), product.getId());
        return wishlistRepository.save(wishlist);
    }
    
    @Transactional
    public void removeFromWishlist(User user, Long productId) {
        logger.info("Removing product {} from wishlist for user {}", productId, user != null ? user.getId() : "null");
        if (user == null) {
            logger.error("User is null when removing from wishlist");
            throw new RuntimeException("User must be authenticated to remove from wishlist");
        }
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));
        
        wishlistRepository.deleteByUserAndProduct(user, product);
    }
    
    @Transactional
    public void clearWishlist(User user) {
        List<Wishlist> wishlist = wishlistRepository.findByUser(user);
        wishlistRepository.deleteAll(wishlist);
    }
    
    public boolean isInWishlist(User user, Long productId) {
        logger.info("Checking if product {} is in wishlist for user {}", productId, user != null ? user.getId() : "null");
        if (user == null) {
            logger.error("User is null when checking wishlist");
            return false;
        }
        
        Product product = productRepository.findById(productId).orElse(null);
        
        if (product == null) {
            return false;
        }
        
        return wishlistRepository.existsByUserAndProduct(user, product);
    }
    
    // Xử lý thông báo khi sản phẩm trong wishlist giảm giá
    @Transactional
    public void notifyPriceDrops(Product product) {
        List<User> users = wishlistRepository.findByProduct(product).stream()
                .map(Wishlist::getUser)
                .collect(Collectors.toList());
        
        for (User user : users) {
            Notification notification = Notification.createWishlistPriceDropNotification(user, product);
            notificationRepository.save(notification);
        }
    }
} 