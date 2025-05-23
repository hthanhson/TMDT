package com.example.tmdt.controller;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.User;
import com.example.tmdt.model.RefundRequest;
import com.example.tmdt.payload.request.OrderRequest;
import com.example.tmdt.payload.request.RefundRequestDto;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.payload.response.OrderResponse;
import com.example.tmdt.service.OrderService;
import com.example.tmdt.service.RefundService;
import com.example.tmdt.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;
    private final RefundService refundService;

    @Autowired
    public OrderController(OrderService orderService, UserService userService, RefundService refundService) {
        this.orderService = orderService;
        this.userService = userService;
        this.refundService = refundService;
    }
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Order> createOrder(@RequestBody OrderRequest orderRequest) throws UnsupportedEncodingException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByUsername(auth.getName());
        return ResponseEntity.ok(orderService.createOrder(user, orderRequest));
    }


    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        Order order = orderService.getOrderById(id);
        
        // Check if current user is the owner of the order or an admin
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!order.getUser().getUsername().equals(auth.getName()) && 
            !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        return ResponseEntity.ok(order);
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getCurrentUserOrders() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByUsername(auth.getName());
        return ResponseEntity.ok(orderService.getUserOrders(user));
    }
    
    @GetMapping("/summary")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getOrderSummary() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByUsername(auth.getName());
        List<Order> userOrders = orderService.getUserOrders(user);
        
        int totalOrders = userOrders.size();
        
        // Đếm số đơn hàng đang xử lý (chưa giao)
        long pendingOrders = userOrders.stream()
                .filter(o -> o.getStatus() != Order.OrderStatus.DELIVERED && 
                             o.getStatus() != Order.OrderStatus.CANCELLED)
                .count();
        
        // Đếm số đơn hàng đã giao
        long deliveredOrders = userOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED)
                .count();
        
        // Tính tổng tiền đã chi
        double totalSpent = userOrders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED)
                .mapToDouble(o -> o.getTotalAmount().doubleValue())
                .sum();
        
        // Lấy 5 đơn hàng gần đây nhất
        List<Map<String, Object>> recentOrders = userOrders.stream()
                .sorted((o1, o2) -> o2.getCreatedAt().compareTo(o1.getCreatedAt()))
                .limit(5)
                .map(order -> {
                    Map<String, Object> orderMap = new HashMap<>();
                    orderMap.put("id", order.getId());
                    orderMap.put("createdAt", order.getCreatedAt().toString());
                    orderMap.put("status", order.getStatus().toString());
                    orderMap.put("totalAmount", order.getTotalAmount().doubleValue());
                    return orderMap;
                })
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalOrders", totalOrders);
        response.put("pendingOrders", pendingOrders);
        response.put("deliveredOrders", deliveredOrders);
        response.put("totalSpent", totalSpent);
        response.put("recentOrders", recentOrders);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam("status") String status) {
        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(orderService.updateOrderStatus(id, orderStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/payment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Order> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam("status") String paymentStatus) {
        return ResponseEntity.ok(orderService.updatePaymentStatus(id, paymentStatus.toUpperCase()));
    }

    @GetMapping("/by-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getOrdersByStatus(@RequestParam("status") String status) {
        try {
            Order.OrderStatus orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
            return ResponseEntity.ok(orderService.getOrdersByStatus(orderStatus));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/by-date")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Order>> getOrdersByDateRange(
            @RequestParam("start") String startDate,
            @RequestParam("end") String endDate) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
            LocalDateTime start = LocalDateTime.parse(startDate, formatter);
            LocalDateTime end = LocalDateTime.parse(endDate, formatter);
            return ResponseEntity.ok(orderService.getOrdersByDateRange(start, end));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            // Get the order
            Order order = orderService.getOrderById(id);
            
            // Check if current user is the owner of the order or an admin
            boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!order.getUser().getId().equals(user.getId()) && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Check if order can be cancelled (only PENDING or PROCESSING orders)
            if (order.getStatus() != Order.OrderStatus.PENDING && 
                order.getStatus() != Order.OrderStatus.PROCESSING && order.getStatus() != Order.OrderStatus.READY_TO_SHIP) {
                return ResponseEntity.badRequest()
                    .body(null); // Cannot cancel orders that are already shipped, delivered or cancelled
            }
            
            // Cancel the order using the enum directly
            return ResponseEntity.ok(orderService.updateOrderStatus(id, Order.OrderStatus.CANCELLED));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}/refund")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Order> refundOrder(@PathVariable Long id) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            // Get the order
            Order order = orderService.getOrderById(id);
            
            // Check if current user is the owner of the order or an admin
            boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!order.getUser().getId().equals(user.getId()) && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Check if order can be refunded (only for CANCELLED orders)
            if (order.getStatus() != Order.OrderStatus.CANCELLED) {
                return ResponseEntity.badRequest()
                    .body(null); // Cannot refund orders that are not cancelled
            }
            
            // Process the refund
            return ResponseEntity.ok(orderService.refundOrder(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping(value = "/{id}/request-refund", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> requestRefund(
            @PathVariable Long id,
            @RequestPart("reason") @Valid String reason,
            @RequestPart(value = "additionalInfo", required = false) String additionalInfo,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            // Get the order
            Order order = orderService.getOrderById(id);
            
            // Check if current user is the owner of the order
            if (!order.getUserId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("You don't have permission to request a refund for this order"));
            }
            
            // Create RefundRequestDto
            RefundRequestDto requestDto = new RefundRequestDto();
            requestDto.setOrderId(id);
            requestDto.setReason(reason);
            requestDto.setAdditionalInfo(additionalInfo);
            
            // Process refund request
            RefundRequest refundRequest = refundService.createRefundRequest(user, requestDto, images);
            return ResponseEntity.ok(refundRequest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to request refund: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/refund-status")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getRefundStatus(@PathVariable Long id) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            // Get the order
            Order order = orderService.getOrderById(id);
            
            // Check if current user is the owner of the order or an admin
            boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!order.getUserId().equals(user.getId()) && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                      .body(new MessageResponse("You don't have permission to view this order's refund status"));
            }
            
            // Get refund request for the order
            Optional<RefundRequest> refundRequestOpt = refundService.getRefundRequestByOrderId(id);
            
            if (refundRequestOpt.isPresent()) {
                return ResponseEntity.ok(refundRequestOpt.get());
            } else {
                return ResponseEntity.ok(new MessageResponse("No refund request found for this order"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving refund status: " + e.getMessage()));
        }
    }
} 