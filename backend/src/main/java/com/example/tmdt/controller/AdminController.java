package com.example.tmdt.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

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
import org.springframework.web.bind.annotation.RestController;

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
    private OrderService orderService;
    
    @Autowired
    private CouponRepository couponRepository;

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
        
        // Get recent orders
        List<Map<String, Object>> recentOrders = orders.stream()
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .limit(5)
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
                    return productMap;
                })
                .collect(Collectors.toList());
        
        response.put("totalUsers", totalUsers);
        response.put("totalOrders", totalOrders);
        response.put("totalProducts", totalProducts);
        response.put("totalRevenue", totalRevenue);
        response.put("recentOrders", recentOrders);
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
}