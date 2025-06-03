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

import com.example.tmdt.model.*;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

//import com.example.tmdt.model.ProductImage;
import com.example.tmdt.payload.request.ReviewRequest;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.repository.ProductRepository;
import com.example.tmdt.repository.OrderRepository;
import com.example.tmdt.service.ReviewService;
import com.example.tmdt.service.UserService;

import java.util.Comparator;
import java.util.stream.Collectors;
import java.time.LocalDate;

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
    
    @Autowired
    private OrderRepository orderRepository;

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
//            if (product.getImages() != null) {
//                response.put("images", product.getImages());
//            }
//
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

    @GetMapping("/search/advanced")
    public ResponseEntity<?> advancedSearch(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String search, 
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "12") int size,
            @RequestParam(required = false, defaultValue = "newest") String sort) {
        
        try {
            // Xử lý tham số keyword và search (ưu tiên keyword nếu cả hai đều có)
            String searchTerm = keyword != null ? keyword : search;
            
            // Lấy tất cả sản phẩm để áp dụng bộ lọc
            List<Product> allProducts = productRepository.findAll();
            List<Product> filteredProducts = new ArrayList<>(allProducts);
            
            // Lọc theo category
            if (category != null && !category.isEmpty() && !category.equalsIgnoreCase("all")) {
                String categoryLower = category.toLowerCase();
                filteredProducts = filteredProducts.stream()
                        .filter(p -> p.getCategory() != null && 
                                (p.getCategory().getName() != null && 
                                p.getCategory().getName().toLowerCase().equals(categoryLower)))
                        .collect(Collectors.toList());
            }
            
            // Lọc theo searchTerm
            if (searchTerm != null && !searchTerm.isEmpty()) {
                String searchLower = searchTerm.toLowerCase();
                filteredProducts = filteredProducts.stream()
                        .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(searchLower)) ||
                                (p.getDescription() != null && p.getDescription().toLowerCase().contains(searchLower)) ||
                                (p.getCategory() != null && p.getCategory().getName() != null && 
                                 p.getCategory().getName().toLowerCase().contains(searchLower)))
                        .collect(Collectors.toList());
            }
            
            // Lọc theo khoảng giá
            if (minPrice != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(p -> p.getPrice() >= minPrice)
                        .collect(Collectors.toList());
            }
            
            if (maxPrice != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(p -> p.getPrice() <= maxPrice)
                        .collect(Collectors.toList());
            }
            
            // Lọc theo rating
            if (minRating != null) {
                filteredProducts = filteredProducts.stream()
                        .filter(p -> p.getAverageRating() >= minRating)
                        .collect(Collectors.toList());
            }
            
            // Lọc theo tồn kho
            if (inStock != null && inStock) {
                filteredProducts = filteredProducts.stream()
                        .filter(p -> p.getStock() > 0)
                        .collect(Collectors.toList());
            }
            
            // Sắp xếp sản phẩm
            if (sort != null) {
                switch (sort) {
                    case "price_asc":
                        filteredProducts.sort(Comparator.comparing(Product::getPrice));
                        break;
                    case "price_desc":
                        filteredProducts.sort(Comparator.comparing(Product::getPrice).reversed());
                        break;
                    case "rating":
                        filteredProducts.sort(Comparator.comparing(Product::getAverageRating).reversed());
                        break;
                    case "newest":
                    default:
                        // Giả sử ID cao hơn = sản phẩm mới hơn
                        filteredProducts.sort(Comparator.comparing(Product::getId).reversed());
                        break;
                }
            }
            
            // Phân trang kết quả
            int totalItems = filteredProducts.size();
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, totalItems);
            
            List<Product> pagedProducts = startIndex < endIndex 
                    ? filteredProducts.subList(startIndex, endIndex) 
                    : new ArrayList<>();
            
            // Tạo đối tượng phản hồi phân trang
            Map<String, Object> response = new HashMap<>();
            response.put("content", pagedProducts);
            response.put("totalElements", totalItems);
            response.put("totalPages", (int) Math.ceil((double) totalItems / size));
            response.put("size", size);
            response.put("number", page);
            response.put("first", page == 0);
            response.put("last", endIndex >= totalItems);
            response.put("empty", pagedProducts.isEmpty());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error during advanced search: " + e.getMessage()));
        }
    }

    @GetMapping("/top-by-month")
    public ResponseEntity<List<Product>> getTopProductsByMonth(
            @RequestParam(defaultValue = "0") int month,
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "10") int limit) {
        
        try {
            // Nu1ebfu khu00f4ng cu00f3 thu00e1ng/nu0103m, lu1ea5y thu00e1ng tru01b0u1edbc
            LocalDate today = LocalDate.now();
            int targetMonth = month > 0 ? month : (today.getMonthValue() == 1 ? 12 : today.getMonthValue() - 1);
            int targetYear = year > 0 ? year : (today.getMonthValue() == 1 ? today.getYear() - 1 : today.getYear());
            
            // Tu1ea1o thu1eddi gian bu1eaft u0111u1ea7u vu00e0 ku1ebft thu00fac cho thu00e1ng
            LocalDate startDate = LocalDate.of(targetYear, targetMonth, 1);
            LocalDate endDate = startDate.plusMonths(1).minusDays(1);
            
            // Lu1ea5y tu1ea5t cu1ea3 u0111u01a1n hu00e0ng trong thu00e1ng u0111u00f3
            List<Order> orders = orderRepository.findByCreatedAtBetween(
                    startDate.atStartOfDay(),
                    endDate.atTime(23, 59, 59));
            
            // Thu1ed1ng ku00ea su1ed1 lu01b0u1ee3ng bu00e1n theo su1ea3n phu1ea9m
            Map<Long, Integer> productSalesCount = new HashMap<>();
            
            for (Order order : orders) {
                if (order.getOrderItems() != null) {
                    for (OrderItem item : order.getOrderItems()) {
                        Long productId = item.getProduct().getId();
                        int quantity = item.getQuantity();
                        productSalesCount.put(productId, productSalesCount.getOrDefault(productId, 0) + quantity);
                    }
                }
            }
            
            // Su1eafp xu1ebfp cu00e1c su1ea3n phu1ea9m theo su1ed1 lu01b0u1ee3ng bu00e1n ra giu1ea3m du1ea7n
            List<Map.Entry<Long, Integer>> sortedProducts = productSalesCount.entrySet().stream()
                    .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                    .limit(limit)
                    .collect(Collectors.toList());
            
            // Lu1ea5y thu00f4ng tin chi tiu1ebft cu1ee7a cu00e1c su1ea3n phu1ea9m
            List<Product> topProducts = new ArrayList<>();
            for (Map.Entry<Long, Integer> entry : sortedProducts) {
                productRepository.findById(entry.getKey()).ifPresent(topProducts::add);
            }
            
            return new ResponseEntity<>(topProducts, HttpStatus.OK);
            
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

    // Add endpoint to directly serve a product image with fallback to default
    @GetMapping("/images/product/{id}")
    public ResponseEntity<?> getProductImageById(@PathVariable Long id) {
        try {
            System.out.println("Fetching image for product ID: " + id);

            // Try to find the product
            Optional<Product> productOpt = productRepository.findById(id);
            if (!productOpt.isPresent()) {
                System.out.println("Product not found: " + id);
                // Return default image if product not found
                return serveDefaultImage();
            }

            Product product = productOpt.get();
            String imageUrl = product.getImageUrl();

            // Check if product has an imageUrl
            if (imageUrl == null || imageUrl.isEmpty()) {
                System.out.println("Product has no imageUrl, using default");
                return serveDefaultImage();
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
                "src/main/resources/static/images/products/" + filename,
                "src/main/resources/static/images/" + filename,
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
                return serveDefaultImage();
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
            return serveDefaultImage();
        }
    }
    
    // Helper method to serve default image
    private ResponseEntity<?> serveDefaultImage() {
        try {
            // Path to default image - adjust this to your project structure
            Path defaultImagePath = Paths.get("src/main/resources/static/images/default-product.jpg");
            
            // If default image doesn't exist, try alternative paths
            if (!Files.exists(defaultImagePath)) {
                String[] alternativePaths = {
                    "src/main/resources/static/images/default.jpg",
                    "src/main/resources/static/default-product.jpg",
                    "src/main/resources/static/default.jpg"
                };
                
                for (String path : alternativePaths) {
                    Path altPath = Paths.get(path);
                    if (Files.exists(altPath)) {
                        defaultImagePath = altPath;
                        break;
                    }
                }
                
                // Create a very basic default image if no image file found
                if (!Files.exists(defaultImagePath)) {
                    return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, "image/svg+xml")
                        .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                        .body("<svg width='200' height='200' xmlns='http://www.w3.org/2000/svg'>"
                            + "<rect width='200' height='200' fill='#cccccc'/>"
                            + "<text x='50%' y='50%' font-family='Arial' font-size='16' text-anchor='middle' fill='#666666'>"
                            + "No Image"
                            + "</text></svg>");
                }
            }
            
            // Get content type
            String contentType = Files.probeContentType(defaultImagePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }
            
            // Return the default image
            Resource resource = new FileSystemResource(defaultImagePath.toFile());
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(resource);
                
        } catch (IOException e) {
            System.err.println("Error serving default image: " + e.getMessage());
            e.printStackTrace();
            
            // Last resort: return a simple text response
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Image not found");
        }
    }
}