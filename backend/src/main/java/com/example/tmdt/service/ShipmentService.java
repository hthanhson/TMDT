package com.example.tmdt.service;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.OrderStatus;
import com.example.tmdt.model.ShipmentTracking;
import com.example.tmdt.payload.request.StatusUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ShipmentService {
    List<ShipmentTracking> getShipmentTrackingByOrderId(Long orderId);
    List<ShipmentTracking> getShipmentTrackingByShipperId(Long shipperId);
    ShipmentTracking updateOrderStatus(Long orderId, StatusUpdateRequest statusUpdateRequest, Long shipperId);
    
    // Additional methods
    Page<Order> getShipperOrders(Long shipperId, Pageable pageable);
    Page<Order> getShipperOrdersByStatus(Long shipperId, OrderStatus status, Pageable pageable);
    Page<Order> getOrdersReadyToShip(Pageable pageable);
    Page<Order> getExpandedOrdersReadyToShip(Pageable pageable);
    Order acceptOrder(Long orderId, Long shipperId);
    Order updateOrderStatus(Long orderId, OrderStatus newStatus, String location, 
                          String description, Long shipperId, Double latitude, Double longitude);
    List<ShipmentTracking> getOrderTrackingHistory(Long orderId);
} 