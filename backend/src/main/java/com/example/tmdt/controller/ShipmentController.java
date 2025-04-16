package com.example.tmdt.controller;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.Order.OrderStatus;
import com.example.tmdt.model.ShipmentTracking;
import com.example.tmdt.model.User;
import com.example.tmdt.payload.request.StatusUpdateRequest;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.repository.OrderRepository;
import com.example.tmdt.service.OrderService;
import com.example.tmdt.service.ShipmentTrackingService;
import com.example.tmdt.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/shipment")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ShipmentController {

    private final OrderService orderService;
    private final ShipmentTrackingService shipmentTrackingService;
    
    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    public ShipmentController(OrderService orderService, ShipmentTrackingService shipmentTrackingService) {
        this.orderService = orderService;
        this.shipmentTrackingService = shipmentTrackingService;
    }

    @GetMapping("/orders")
    @PreAuthorize("hasRole('SHIPPER')")
    public ResponseEntity<List<Order>> getShipperOrders(@AuthenticationPrincipal User user) {
        List<Order> orders = orderService.getOrdersByShipperId(user.getId());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/status/{status}")
    @PreAuthorize("hasRole('SHIPPER')")
    public ResponseEntity<List<Order>> getShipperOrdersByStatus(
            @AuthenticationPrincipal User user,
            @PathVariable OrderStatus status) {
        List<Order> orders = orderService.getOrdersByShipperAndStatus(user.getId(), status);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/ready")
    @PreAuthorize("hasRole('SHIPPER')")
    public ResponseEntity<List<Order>> getOrdersReadyForShipment() {
        List<Order> orders = orderService.getOrdersReadyForShipment();
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/orders/{orderId}/accept")
    @PreAuthorize("hasRole('SHIPPER')")
    public ResponseEntity<?> acceptOrder(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId) {
        try {
            Order order = orderService.assignOrderToShipper(orderId, user.getId());
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/orders/{orderId}/status")
    @PreAuthorize("hasRole('SHIPPER')")
    public ResponseEntity<?> updateOrderStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId,
            @RequestBody StatusUpdateRequest request) {
        try {
            // Verify that the order is assigned to this shipper
            Order order = orderService.getOrderById(orderId);
            if (!order.getShipperId().equals(user.getId())) {
                return ResponseEntity.status(403).body(new MessageResponse("You are not authorized to update this order"));
            }
            
            // Update the order status
            order = orderService.updateOrderStatus(orderId, request.getStatus());
            
            // Create tracking entry
            ShipmentTracking tracking = shipmentTrackingService.createTrackingEntry(order, request, user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("order", order);
            response.put("tracking", tracking);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/orders/{orderId}/tracking")
    public ResponseEntity<?> getOrderTracking(@PathVariable Long orderId) {
        try {
            List<ShipmentTracking> trackingHistory = shipmentTrackingService.getTrackingHistoryByOrderId(orderId);
            return ResponseEntity.ok(trackingHistory);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/orders/{orderId}/status")
    public ResponseEntity<?> getOrderStatus(@PathVariable Long orderId) {
        try {
            Order order = orderService.getOrderById(orderId);
            ShipmentTracking currentStatus = shipmentTrackingService.getCurrentStatus(orderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("orderId", order.getId());
            response.put("status", order.getStatus().toString());
            response.put("updatedAt", order.getUpdatedAt());
            if (currentStatus != null) {
                response.put("location", currentStatus.getLocation());
                response.put("notes", currentStatus.getNotes());
                response.put("statusUpdatedAt", currentStatus.getCreatedAt());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    // Methods from ShipmentTrackingController
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getShipmentTracking(@PathVariable Long orderId) {
        List<ShipmentTracking> trackingList = shipmentTrackingService.getTrackingHistoryByOrderId(orderId);
        return ResponseEntity.ok(trackingList);
    }

    @PostMapping("/{orderId}/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateShipmentStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody StatusUpdateRequest statusRequest) {
        
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Order not found!"));
        }

        Order order = orderOpt.get();
        
        // Update order status
        order.setStatus(statusRequest.getStatus());
        orderRepository.save(order);
        
        // Get admin user ID
        Long userId = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            userId = ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        
        // Create tracking entry
        ShipmentTracking tracking = shipmentTrackingService.createTrackingEntry(order, statusRequest, userId);
        
        return ResponseEntity.ok(new MessageResponse("Shipment status updated successfully!"));
    }
} 