package com.example.tmdt.service;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.ShipmentTracking;
import com.example.tmdt.payload.request.StatusUpdateRequest;

import java.util.List;

public interface ShipmentTrackingService {
    ShipmentTracking createTrackingEntry(Order order, StatusUpdateRequest statusUpdateRequest, Long userId);
    List<ShipmentTracking> getTrackingHistoryByOrderId(Long orderId);
    ShipmentTracking getCurrentStatus(Long orderId);
    List<ShipmentTracking> getShipperAssignments(Long shipperId);
} 