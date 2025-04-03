package com.example.tmdt.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.tmdt.model.Product;
import com.example.tmdt.model.Review;
import com.example.tmdt.model.User;
import com.example.tmdt.payload.request.ReviewRequest;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.repository.ProductRepository;
import com.example.tmdt.service.ReviewService;
import com.example.tmdt.service.UserService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/products")
public class ProductController {
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private ReviewService reviewService;
    
    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<Product>> getRecommendedProducts(@RequestParam(defaultValue = "10") int limit) {
        List<Product> recommendedProducts = productRepository.findTop10ByOrderByAverageRatingDesc();
        int actualLimit = Math.min(limit, recommendedProducts.size());
        return new ResponseEntity<>(recommendedProducts.subList(0, actualLimit), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Optional<Product> productData = productRepository.findById(id);
        if (productData.isPresent()) {
            return new ResponseEntity<>(productData.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        List<Product> products = productRepository.findByCategory(category);
        return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam String query) {
        List<Product> products = productRepository.search(query);
        return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @GetMapping("/top")
    public ResponseEntity<List<Product>> getTopProducts() {
        List<Product> products = productRepository.findTop10ByOrderByAverageRatingDesc();
        return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        try {
            Product newProduct = productRepository.save(product);
            return new ResponseEntity<>(newProduct, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        Optional<Product> productData = productRepository.findById(id);
        if (productData.isPresent()) {
            Product updatedProduct = productData.get();
            updatedProduct.setName(product.getName());
            updatedProduct.setDescription(product.getDescription());
            updatedProduct.setPrice(product.getPrice());
            updatedProduct.setImageUrl(product.getImageUrl());
            updatedProduct.setCategory(product.getCategory());
            updatedProduct.setStock(product.getStock());
            
            return new ResponseEntity<>(productRepository.save(updatedProduct), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HttpStatus> deleteProduct(@PathVariable Long id) {
        try {
            productRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{id}/reviews")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> addReview(@PathVariable Long id, @RequestBody ReviewRequest reviewRequest) {
        try {
            // Get the current authenticated user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            // Get the product
            Optional<Product> productData = productRepository.findById(id);
            if (!productData.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Product not found"));
            }
            
            Product product = productData.get();
            
            // Check if user has already reviewed this product
            if (reviewService.hasUserReviewed(user, product)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("You have already reviewed this product"));
            }
            
            // Create the review
            Review review = new Review();
            review.setUser(user);
            review.setProduct(product);
            review.setRating(reviewRequest.getRating());
            review.setComment(reviewRequest.getComment());
            
            // Save the review
            Review savedReview = reviewService.createReview(review, null);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedReview);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error adding review: " + e.getMessage()));
        }
    }
} 