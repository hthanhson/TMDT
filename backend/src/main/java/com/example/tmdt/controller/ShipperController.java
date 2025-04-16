package com.example.tmdt.controller;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.OrderStatus;
import com.example.tmdt.model.ShipmentTracking;
import com.example.tmdt.payload.request.StatusUpdateRequest;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.payload.response.PagedResponse;
import com.example.tmdt.security.services.UserDetailsImpl;
import com.example.tmdt.service.ShipmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/shipper")
@PreAuthorize("hasRole('SHIPPER')")
public class ShipperController {

    @Autowired
    private ShipmentService shipmentService;

    @GetMapping("/orders")
    public ResponseEntity<?> getShipperOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        
        try {
            Long shipperId = getCurrentUserId();
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            
            Page<Order> orderPage;
            if (status != null && !status.isEmpty()) {
                OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
                orderPage = shipmentService.getShipperOrdersByStatus(shipperId, orderStatus, pageable);
            } else {
                orderPage = shipmentService.getShipperOrders(shipperId, pageable);
            }
            
            return ResponseEntity.ok(new PagedResponse<>(
                    orderPage.getContent(),
                    orderPage.getNumber(),
                    orderPage.getSize(),
                    orderPage.getTotalElements(),
                    orderPage.getTotalPages(),
                    orderPage.isLast()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving orders: " + e.getMessage()));
        }
    }
    

    @GetMapping("/orders/available")
    public ResponseEntity<?> getAvailableOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<Order> orderPage = shipmentService.getExpandedOrdersReadyToShip(pageable);
            
            return ResponseEntity.ok(new PagedResponse<>(
                    orderPage.getContent(),
                    orderPage.getNumber(),
                    orderPage.getSize(),
                    orderPage.getTotalElements(),
                    orderPage.getTotalPages(),
                    orderPage.isLast()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving available orders: " + e.getMessage()));
        }
    }
    
    /**
     * Accept an order for delivery
     */
    @PostMapping("/orders/{orderId}/accept")
    public ResponseEntity<?> acceptOrder(@PathVariable Long orderId) {
        try {
            Long shipperId = getCurrentUserId();
            Order order = shipmentService.acceptOrder(orderId, shipperId);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error accepting order: " + e.getMessage()));
        }
    }
    
    /**
     * Update order status
     */
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody StatusUpdateRequest statusUpdateRequest) {
        
        try {
            Long shipperId = getCurrentUserId();
            ShipmentTracking tracking = shipmentService.updateOrderStatus(
                    orderId, statusUpdateRequest, shipperId);
            
            return ResponseEntity.ok(tracking);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error updating order status: " + e.getMessage()));
        }
    }
    
    /**
     * Get tracking history for an order
     */
    @GetMapping("/orders/{orderId}/tracking")
    public ResponseEntity<?> getOrderTrackingHistory(@PathVariable Long orderId) {
        try {
            List<ShipmentTracking> trackingHistory = shipmentService.getOrderTrackingHistory(orderId);
            return ResponseEntity.ok(trackingHistory);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving tracking history: " + e.getMessage()));
        }
    }
    
    /**
     * Get current user ID from security context
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }
} 