package com.example.tmdt.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.ArrayList;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
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
import com.example.tmdt.model.ProductImage;
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
    public ResponseEntity<?> getProduct(@PathVariable Long id) {
        try {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            
            // Tạo response tùy chỉnh thay vì trả về Product trực tiếp
            Map<String, Object> response = new HashMap<>();
            response.put("id", product.getId());
            response.put("name", product.getName());
            response.put("price", product.getPrice());
            response.put("description", product.getDescription());
            response.put("averageRating", product.getAverageRating());
            response.put("reviewCount", product.getReviewCount());
            response.put("stock", product.getStock());
            
            // Xử lý danh sách hình ảnh
            if (product.getImages() != null) {
                response.put("images", product.getImages());
            }
            
            // Xử lý category
            if (product.getCategory() != null) {
                response.put("category", product.getCategory());
            }
            
            // Tạo lại danh sách reviews một cách rõ ràng, đảm bảo mỗi review có đúng cấu trúc
            List<Map<String, Object>> reviewsList = new ArrayList<>();
            if (product.getReviews() != null) {
                for (Review review : product.getReviews()) {
                    Map<String, Object> reviewMap = new HashMap<>();
                    reviewMap.put("id", review.getId());
                    reviewMap.put("title", review.getTitle());
                    reviewMap.put("rating", review.getRating());
                    reviewMap.put("comment", review.getComment());
                    reviewMap.put("createdAt", review.getCreatedAt());
                    reviewMap.put("updatedAt", review.getUpdatedAt());
                    reviewMap.put("anonymous", review.getAnonymous());

                    // QUAN TRỌNG: Luôn tạo đối tượng user đầy đủ và userId riêng biệt
                    if (review.getUser() != null) {
                        // Lấy ID người dùng
                        Long userId = review.getUser().getId();
                        reviewMap.put("userId", userId);
                        
                        // Tạo đối tượng user đầy đủ, luôn đảm bảo là object
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("id", userId);
                        
                        // Thêm thông tin user khác nếu có
                        User user = review.getUser();
                        if (user.getUsername() != null) {
                            userMap.put("username", user.getUsername());
                        }
                        if (user.getFullName() != null) {
                            userMap.put("fullName", user.getFullName());
                        }
                        
                        // Gán user object vào review
                        reviewMap.put("user", userMap);
                        
                        // Thiết lập userName hiển thị tùy thuộc vào anonymous
                        if (review.getAnonymous() != null && review.getAnonymous()) {
                            reviewMap.put("userName", "Người dùng ẩn danh");
                        } else {
                            String displayName = user.getFullName() != null ? user.getFullName() : user.getUsername();
                            reviewMap.put("userName", displayName);
                        }
                    }
                    
                    reviewsList.add(reviewMap);
                }
            }
            response.put("reviews", reviewsList);
            
            // Thêm các thuộc tính khác của sản phẩm nếu cần
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Không tìm thấy sản phẩm với id: " + id + ". Lỗi: " + e.getMessage()));
        }
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getProductsByCategory(@PathVariable String category) {
        try {
            // Log to debug
            System.out.println("Searching for category: " + category);
            
            // Find products by category name (case insensitive)
            List<Product> products = productRepository.findByCategoryNameIgnoreCase(category);
            
            // Log results
            System.out.println("Found " + products.size() + " products in category: " + category);
            
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error searching by category: " + category + ", error: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(new ArrayList<>(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> searchProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category) {
        try {
            System.out.println("Search request - query: " + query + ", category: " + category);
            
            List<Product> products;
            
            if (category != null && !category.isEmpty()) {
                // If category is provided, use it for filtering
                if (query != null && !query.isEmpty()) {
                    // Both category and query
                    products = productRepository.findByCategoryNameIgnoreCaseAndNameContainingIgnoreCase(category, query);
                } else {
                    // Only category
                    products = productRepository.findByCategoryNameIgnoreCase(category);
                }
            } else if (query != null && !query.isEmpty()) {
                // Only query
                products = productRepository.search(query);
            } else {
                // No filters, return all
                products = productRepository.findAll();
            }
            
            System.out.println("Found " + products.size() + " products in search");
            return new ResponseEntity<>(products, HttpStatus.OK);
        } catch (Exception e) {
            System.err.println("Error in search: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(new ArrayList<>(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/top")
    public ResponseEntity<List<Product>> getTopProducts(@RequestParam(defaultValue = "4") int limit) {
        List<Product> products = productRepository.findTop10ByOrderByAverageRatingDesc();
        int actualLimit = Math.min(limit, products.size());
        return new ResponseEntity<>(products.subList(0, actualLimit), HttpStatus.OK);
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
    public ResponseEntity<?> addReview(
            @PathVariable Long id, 
            @RequestBody ReviewRequest reviewRequest,
            @RequestParam(required = false, defaultValue = "false") boolean allowMultiple,
            @RequestParam(required = false, defaultValue = "false") boolean includeUserDetails) {
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
            
            // Check if user has already reviewed this product, unless allowMultiple is true
            if (!allowMultiple && reviewService.hasUserReviewed(user, product)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("You have already reviewed this product"));
            }
            
            // Create the review
            Review review = new Review();
            review.setUser(user);
            review.setProduct(product);
            review.setRating(reviewRequest.getRating());
            review.setComment(reviewRequest.getComment());
            review.setAnonymous(reviewRequest.isAnonymous());
            
            // Save the review
            Review savedReview = reviewService.createReview(review);
            
            // Luôn trả về đầy đủ thông tin nếu request từ frontend
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedReview.getId());
            response.put("rating", savedReview.getRating());
            response.put("comment", savedReview.getComment());
            response.put("createdAt", savedReview.getCreatedAt());
            response.put("anonymous", savedReview.getAnonymous());
            
            // Thêm userId và thông tin user (bất kể includeUserDetails)
            response.put("userId", user.getId());
            
            // Thêm thông tin chi tiết người dùng nếu yêu cầu
            if (includeUserDetails) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("username", user.getUsername());
                userInfo.put("fullName", user.getFullName());
                response.put("user", userInfo);
                
                // Thêm trực tiếp các trường thông tin người dùng
                response.put("fullName", user.getFullName());
                response.put("userName", user.getFullName() != null ? user.getFullName() : user.getUsername());
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error adding review: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/user-reviews")
    public ResponseEntity<?> getUserReviewsForProduct(
            @PathVariable Long id, 
            @RequestParam(required = true) Long userId) {
        try {
            // Get the user
            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("User not found"));
            }
            
            // Get the product
            Optional<Product> productData = productRepository.findById(id);
            if (!productData.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Product not found"));
            }
            
            Product product = productData.get();
            
            // Get all reviews for this user and product
            List<Review> reviews = reviewService.getUserReviewsForProduct(user, product);
            
            // Chuyển đổi kết quả sang định dạng phù hợp
            List<Map<String, Object>> formattedReviews = new ArrayList<>();
            for (Review review : reviews) {
                Map<String, Object> reviewMap = new HashMap<>();
                reviewMap.put("id", review.getId());
                reviewMap.put("rating", review.getRating());
                reviewMap.put("comment", review.getComment());
                reviewMap.put("createdAt", review.getCreatedAt());
                reviewMap.put("anonymous", review.getAnonymous());
                reviewMap.put("userId", user.getId());
                
                // Thêm thông tin về user
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("id", user.getId());
                userInfo.put("username", user.getUsername());
                userInfo.put("fullName", user.getFullName());
                reviewMap.put("user", userInfo);
                
                // Thêm trực tiếp các trường người dùng
                reviewMap.put("fullName", user.getFullName());
                reviewMap.put("userName", user.getFullName() != null ? user.getFullName() : user.getUsername());
                
                formattedReviews.add(reviewMap);
            }
            
            return ResponseEntity.ok(formattedReviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error getting user reviews: " + e.getMessage()));
        }
    }

    // Add endpoint to serve product images
    @GetMapping("/image/{filename:.+}")
    public ResponseEntity<Resource> getProductImage(@PathVariable String filename) {
        try {
            // Log the request for debugging
            System.out.println("Received request for product image: " + filename);
            
            // Attempt to load from different locations
            Path filePath = null;
            
            // Try backend/uploads/products first (most likely)
            Path backendPath = Paths.get("backend/uploads/products/" + filename);
            if (Files.exists(backendPath)) {
                filePath = backendPath;
                System.out.println("Found image at: " + backendPath.toAbsolutePath());
            } else {
                // Try uploads/products as fallback
                Path regularPath = Paths.get("uploads/products/" + filename);
                if (Files.exists(regularPath)) {
                    filePath = regularPath;
                    System.out.println("Found image at fallback location: " + regularPath.toAbsolutePath());
                }
            }
            
            // If file not found in any location
            if (filePath == null) {
                System.out.println("Image not found in any location: " + filename);
                return ResponseEntity.notFound().build();
            }
            
            // Get file content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            // Create resource and return it
            Resource resource = new FileSystemResource(filePath.toFile());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .body(resource);
        } catch (IOException e) {
            System.err.println("Error serving product image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/image-debug")
    public ResponseEntity<?> getProductImageDebugInfo(@PathVariable Long id) {
        try {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Product not found"));
            
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("productId", product.getId());
            debugInfo.put("productName", product.getName());
            
            // Log image sources
            debugInfo.put("imageUrl", product.getImageUrl());
            
            // Log images collection
            List<String> imageUrls = new ArrayList<>();
            if (product.getImages() != null) {
                for (ProductImage img : product.getImages()) {
                    if (img.getImageUrl() != null) {
                        imageUrls.add(img.getImageUrl());
                    }
                }
            }
            debugInfo.put("productImageUrls", imageUrls);
            
            // Check file system for potential image files
            String uploadDir = "uploads/products/";
            Path uploadPath = Paths.get(uploadDir);
            
            List<String> possibleImageFiles = new ArrayList<>();
            if (Files.exists(uploadPath) && Files.isDirectory(uploadPath)) {
                try (var stream = Files.list(uploadPath)) {
                    stream
                        .filter(path -> path.getFileName().toString().toLowerCase().contains(String.valueOf(id)))
                        .forEach(path -> possibleImageFiles.add(path.getFileName().toString()));
                }
            }
            
            debugInfo.put("possibleImageFiles", possibleImageFiles);
            
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not retrieve image debug info", "details", e.getMessage()));
        }
    }

    // Add endpoint to serve default image for products with missing images
    @GetMapping("/images/default")
    public ResponseEntity<Resource> getDefaultProductImage() {
        try {
            // Define paths to look for default image
            String[] possiblePaths = {
                "uploads/products/default-product.jpg",
                "uploads/products/default.jpg",
                "uploads/products/placeholder.jpg",
                "src/main/resources/static/images/default-product.jpg"
            };
            
            Path filePath = null;
            for (String path : possiblePaths) {
                Path testPath = Paths.get(path);
                if (Files.exists(testPath)) {
                    filePath = testPath;
                    System.out.println("Found default image at: " + testPath.toAbsolutePath());
                    break;
                }
            }
            
            // If no default image found, create a simple one
            if (filePath == null) {
                System.out.println("No default image found, creating one");
                // Create uploads/products directory if it doesn't exist
                Path uploadDir = Paths.get("uploads/products");
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }
                
                // Use a placeholder from resources or create an empty file
                filePath = Paths.get("uploads/products/default-product.jpg");
                // Just create an empty file if nothing else works
                if (!Files.exists(filePath)) {
                    Files.createFile(filePath);
                }
            }
            
            // Get file content type
            String contentType = "image/jpeg";
            
            // Create resource and return it
            Resource resource = new FileSystemResource(filePath.toFile());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400") // Cache for 24 hours
                    .body(resource);
        } catch (IOException e) {
            System.err.println("Error serving default product image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Add endpoint to directly serve a product image with fallback to default
    @GetMapping("/images/product/{id}")
    public ResponseEntity<Resource> getProductImageById(@PathVariable Long id) {
        try {
            System.out.println("Fetching image for product ID: " + id);
            
            // Try to find the product
            Optional<Product> productOpt = productRepository.findById(id);
            if (!productOpt.isPresent()) {
                System.out.println("Product not found: " + id);
                return getDefaultProductImage();
            }
            
            Product product = productOpt.get();
            String imageUrl = product.getImageUrl();
            
            // Check if product has an imageUrl
            if (imageUrl == null || imageUrl.isEmpty()) {
                System.out.println("Product has no imageUrl, using default");
                return getDefaultProductImage();
            }
            
            // Extract filename from imageUrl
            String filename;
            if (imageUrl.contains("/")) {
                filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            } else {
                filename = imageUrl;
            }
            
            // Try to serve the image
            Path filePath = null;
            
            // Try different paths
            String[] possiblePaths = {
                "uploads/products/" + filename,
                "backend/uploads/products/" + filename,
                imageUrl,
                imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl
            };
            
            for (String path : possiblePaths) {
                Path testPath = Paths.get(path);
                if (Files.exists(testPath)) {
                    filePath = testPath;
                    System.out.println("Found product image at: " + testPath.toAbsolutePath());
                    break;
                }
            }
            
            // If image not found, use default
            if (filePath == null) {
                System.out.println("Product image not found, using default");
                return getDefaultProductImage();
            }
            
            // Get file content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }
            
            // Create resource and return it
            Resource resource = new FileSystemResource(filePath.toFile());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*") // Allow CORS
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400") // Cache for 24 hours
                    .body(resource);
        } catch (IOException e) {
            System.err.println("Error serving product image: " + e.getMessage());
            e.printStackTrace();
            return getDefaultProductImage();
        }
    }
    
    // Add endpoint to serve an image directly by filename with explicit CORS support
    @CrossOrigin(origins = "*")
    @GetMapping("/images/direct/{filename:.+}")
    public ResponseEntity<Resource> getDirectProductImage(@PathVariable String filename) {
        try {
            System.out.println("Directly serving image: " + filename);
            
            // Try to find the file
            Path filePath = null;
            
            // Try different paths
            String[] possiblePaths = {
                "uploads/products/" + filename,
                "backend/uploads/products/" + filename,
                "src/main/resources/static/images/" + filename
            };
            
            for (String path : possiblePaths) {
                Path testPath = Paths.get(path);
                if (Files.exists(testPath)) {
                    filePath = testPath;
                    System.out.println("Found image at: " + testPath.toAbsolutePath());
                    break;
                }
            }
            
            // If image not found, use default
            if (filePath == null) {
                System.out.println("Image not found: " + filename + ", using default");
                return getDefaultProductImage();
            }
            
            // Get file content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }
            
            // Create resource and return it
            Resource resource = new FileSystemResource(filePath.toFile());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*") // Allow CORS
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400") // Cache for 24 hours
                    .body(resource);
        } catch (IOException e) {
            System.err.println("Error serving direct image: " + e.getMessage());
            e.printStackTrace();
            return getDefaultProductImage();
        }
    }
} 