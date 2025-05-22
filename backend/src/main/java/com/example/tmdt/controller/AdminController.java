package com.example.tmdt.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.Product;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Coupon;
import com.example.tmdt.repository.OrderRepository;
import com.example.tmdt.repository.ProductRepository;
import com.example.tmdt.repository.UserRepository;
import com.example.tmdt.repository.CouponRepository;
import com.example.tmdt.service.OrderService;
import java.time.LocalDateTime;
import com.example.tmdt.service.ProductService;
import com.example.tmdt.model.Category;
import com.example.tmdt.repository.CategoryRepository;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartHttpServletRequest;
import javax.servlet.http.HttpServletRequest;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private OrderService orderService;
    
    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private ProductService productService;

    private final String uploadDir = "./backend/uploads/products/";

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        Map<String, Object> response = new HashMap<>();
        
        // Count totals
        long totalUsers = userRepository.count();
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        
        // Calculate total revenue
        List<Order> orders = orderRepository.findAll();
        double totalRevenue = orders.stream()
                .filter(order -> order.getStatus() == Order.OrderStatus.DELIVERED)
                .mapToDouble(order -> order.getTotalAmount().doubleValue())
                .sum();
        
        // Get all orders instead of just recent 5
        List<Map<String, Object>> allOrders = orders.stream()
                .map(order -> {
                    Map<String, Object> orderMap = new HashMap<>();
                    orderMap.put("id", order.getId());
                    orderMap.put("customerName", order.getUser().getFullName());
                    orderMap.put("amount", order.getTotalAmount());
                    orderMap.put("status", order.getStatus().name());
                    orderMap.put("date", order.getCreatedAt().toString());
                    return orderMap;
                })
                .collect(Collectors.toList());
        
        // Get top selling products
        List<Map<String, Object>> productPerformance = productRepository.findAll().stream()
                .sorted((p1, p2) -> p1.getStock().compareTo(p2.getStock()))
                .limit(5)
                .map(product -> {
                    Map<String, Object> productMap = new HashMap<>();
                    productMap.put("id", product.getId());
                    productMap.put("name", product.getName());
                    productMap.put("stock", product.getStock());
                    productMap.put("sales", 0); // This would need to be calculated from order data
                    // Thêm thông tin giá và danh mục sản phẩm
                    productMap.put("price", product.getPrice());
                    productMap.put("category", product.getCategory() != null ? product.getCategory().getName() : "Không phân loại");
                    // Tính doanh thu giả định (số lượng bán * giá)
                    productMap.put("revenue", 0);
                    return productMap;
                })
                .collect(Collectors.toList());
        
        response.put("totalUsers", totalUsers);
        response.put("totalOrders", totalOrders);
        response.put("totalProducts", totalProducts);
        response.put("totalRevenue", totalRevenue);
        response.put("recentOrders", allOrders); // Use all orders instead of just recent 5
        response.put("productPerformance", productPerformance);
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> userData = userRepository.findById(id);
        if (userData.isPresent()) {
            return new ResponseEntity<>(userData.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<HttpStatus> deleteUser(@PathVariable Long id) {
        try {
            userRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return new ResponseEntity<>(orders, HttpStatus.OK);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam Order.OrderStatus status) {
        try {
            Order updatedOrder = orderService.updateOrderStatus(id, status);
            return new ResponseEntity<>(updatedOrder, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productRepository.findAll();
        System.out.println(products);
        return new ResponseEntity<>(products, HttpStatus.OK);
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") Double price,
            @RequestParam("stock") Integer stock,
            @RequestParam(value = "category", required = false) String categoryName,
            @RequestParam(value = "image", required = false) MultipartFile imageFile) {
        try {
            // Enhanced logging with more details
            System.out.println("===== PRODUCT CREATION REQUEST STARTED =====");
            System.out.println("Request content type: " + RequestContextHolder.currentRequestAttributes()
                    .getAttribute("org.springframework.web.servlet.DispatcherServlet.INPUT_REQUEST",
                            RequestAttributes.SCOPE_REQUEST));
            System.out.println("Name: " + name);
            System.out.println("Description: " + description);
            System.out.println("Price: " + price);
            System.out.println("Stock: " + stock);
            System.out.println("Category Name: " + categoryName);
            
            // Debug imageFile
            System.out.println("imageFile parameter: " + (imageFile == null ? "NULL" : "NOT NULL"));
            if (imageFile != null) {
                System.out.println("Image file is empty: " + imageFile.isEmpty());
                System.out.println("Image filename: " + imageFile.getOriginalFilename());
                System.out.println("Image size: " + imageFile.getSize() + " bytes");
                System.out.println("Image content type: " + imageFile.getContentType());
            } else {
                // Try to debug why imageFile is null
                System.out.println("Checking request parameters...");
                HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
                Map<String, String[]> parameterMap = request.getParameterMap();
                System.out.println("All parameters: " + parameterMap.keySet());
                
                // Try to see multipart files
                try {
                    if (request instanceof MultipartHttpServletRequest) {
                        System.out.println("Request is MultipartHttpServletRequest");
                        MultipartHttpServletRequest multipartRequest = (MultipartHttpServletRequest) request;
                        System.out.println("Multipart parameter names: " + multipartRequest.getParameterNames());
                        System.out.println("Multipart file names: " + multipartRequest.getFileNames());
                        Map<String, MultipartFile> fileMap = multipartRequest.getFileMap();
                        System.out.println("File map: " + fileMap.keySet());
                        
                        // Try to get the file directly
                        MultipartFile directImageFile = multipartRequest.getFile("imageFile");
                        System.out.println("Direct image file: " + (directImageFile == null ? "NULL" : "NOT NULL"));
                    } else {
                        System.out.println("Request is not MultipartHttpServletRequest");
                    }
                } catch (Exception e) {
                    System.err.println("Error checking multipart: " + e.getMessage());
                }
            }
            
            // Validate critical fields
            if (name == null || name.trim().isEmpty()) {
                throw new IllegalArgumentException("Product name is required");
            }
            if (description == null || description.trim().isEmpty()) {
                throw new IllegalArgumentException("Product description is required");
            }
            if (price == null || price <= 0) {
                throw new IllegalArgumentException("Invalid product price");
            }
            if (stock == null || stock < 0) {
                throw new IllegalArgumentException("Invalid stock quantity");
            }

            Product product = new Product();
            product.setName(name);
            product.setDescription(description);
            product.setPrice(price);
            product.setStock(stock);
            
            // Find category by name instead of ID
            if (categoryName != null && !categoryName.trim().isEmpty()) {
                try {
                    // First try to find exact match
                    Optional<Category> categoryOpt = categoryRepository.findByName(categoryName.trim());
                    
                    if (categoryOpt.isPresent()) {
                        Category category = categoryOpt.get();
                        product.setCategory(category);
                        System.out.println("Category found by name: " + category.getName() + " (ID: " + category.getId() + ")");
                    } else {
                        System.err.println("Category not found with name: " + categoryName);
                        throw new RuntimeException("Category not found with name: " + categoryName);
                    }
                } catch (Exception e) {
                    System.err.println("Error finding category by name: " + categoryName);
                    System.err.println("Error details: " + e.getMessage());
                    throw e;
                }
            } else {
                System.err.println("WARNING: No category specified. Product will be created without a category.");
            }
            
            // Handle image file if provided
            if (imageFile != null && !imageFile.isEmpty()) {
                try {
                    // Create the directory structure
                    File uploadDir = new File("backend/uploads/products");
                    if (!uploadDir.exists()) {
                        uploadDir.mkdirs();
                    }
                    
                    // Generate unique filename with timestamp
                    String originalFilename = imageFile.getOriginalFilename();
                    String fileExtension = "";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    }
                    String filename = System.currentTimeMillis() + fileExtension;
                    
                    // Save file directly using transferTo
                    File dest = new File(uploadDir.getAbsolutePath() + File.separator + filename);
                    System.out.println("Saving image to: " + dest.getAbsolutePath());
                    imageFile.transferTo(dest);
                    
                    // Set image URL in product using the new controller path
                    String imageUrl = "/uploads/products/" + filename;
                    product.setImageUrl(imageUrl);
                    System.out.println("Image saved successfully. URL set to: " + imageUrl);
                } catch (Exception e) {
                    System.err.println("Error saving image file: " + e.getMessage());
                    e.printStackTrace();
                    throw new RuntimeException("Failed to save image file", e);
                }
            } else {
                System.out.println("No image file provided");
            }

            Product newProduct = productService.createProduct(product);
            System.out.println("===== PRODUCT CREATED SUCCESSFULLY =====");
            System.out.println("Product ID: " + newProduct.getId());
            System.out.println("Product Name: " + newProduct.getName());
            System.out.println("Product Category: " + (newProduct.getCategory() != null ? newProduct.getCategory().getName() : "No Category"));
            System.out.println("Product Image URL: " + newProduct.getImageUrl());
            
            return new ResponseEntity<>(newProduct, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("===== PRODUCT CREATION ERROR =====");
            System.err.println("Error details: " + e.getMessage());
            e.printStackTrace();
            
            // Detailed error response
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(null);
        }
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<HttpStatus> deleteProduct(@PathVariable Long id) {
        try {
            productRepository.deleteById(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/users/{id}/coupons")
    public ResponseEntity<?> assignCouponToUser(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String couponCode = request.get("couponCode");
        if (couponCode == null || couponCode.isEmpty()) {
            return new ResponseEntity<>("Thiếu tham số couponCode", HttpStatus.BAD_REQUEST);
        }
        try {
            Optional<User> userData = userRepository.findById(id);
            if (!userData.isPresent()) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
            
            User user = userData.get();
            
            // Kiểm tra coupon hợp lệ
            Coupon coupon = couponRepository.findByCode(couponCode)
                .orElseThrow(() -> new RuntimeException("Coupon không tồn tại"));
                
            if (!coupon.getIsActive()) {
                return new ResponseEntity<>("Coupon đã hết hiệu lực", HttpStatus.BAD_REQUEST);
            }
            
            if (coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
                return new ResponseEntity<>("Coupon đã hết hạn", HttpStatus.BAD_REQUEST);
            }
            
            // Thêm coupon vào danh sách coupons của user
            coupon.setUser(user);
            user.getCoupons().add(coupon);
            couponRepository.save(coupon);
            userRepository.save(user);
            
            return new ResponseEntity<>(coupon, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/products/{id}/debug")
    public ResponseEntity<?> debugProductImage(@PathVariable Long id) {
        try {
            // Find the product
            Optional<Product> productOpt = productRepository.findById(id);
            if (!productOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Product product = productOpt.get();
            Map<String, Object> response = new HashMap<>();
            
            // Basic product info
            response.put("id", product.getId());
            response.put("name", product.getName());
            
            // Image info
            response.put("imageUrl", product.getImageUrl());
            
            // Check if image file exists
            if (product.getImageUrl() != null && !product.getImageUrl().isEmpty()) {
                String imagePath = product.getImageUrl();
                if (imagePath.startsWith("/uploads/products/")) {
                    String filename = imagePath.substring("/uploads/products/".length());
                    File imageFile = new File("backend/uploads/products/" + filename);
                    
                    response.put("filename", filename);
                    response.put("fileExists", imageFile.exists());
                    response.put("absolutePath", imageFile.getAbsolutePath());
                    response.put("fileSize", imageFile.exists() ? imageFile.length() : 0);
                    
                    // Check if directory exists and is accessible
                    File dir = new File("backend/uploads/products");
                    response.put("directoryExists", dir.exists());
                    response.put("directoryCanRead", dir.canRead());
                    response.put("directoryAbsolutePath", dir.getAbsolutePath());
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}