package com.example.tmdt.service.impl;

import com.example.tmdt.exception.ResourceNotFoundException;
import com.example.tmdt.model.Order;
import com.example.tmdt.model.Order.OrderStatus;
import com.example.tmdt.model.ShipmentTracking;
import com.example.tmdt.payload.request.StatusUpdateRequest;
import com.example.tmdt.repository.OrderRepository;
import com.example.tmdt.repository.ShipmentTrackingRepository;
import com.example.tmdt.service.ShipmentTrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ShipmentTrackingServiceImpl implements ShipmentTrackingService {

    @Autowired
    private ShipmentTrackingRepository shipmentTrackingRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Override
    @Transactional
    public ShipmentTracking createTrackingEntry(Order order, StatusUpdateRequest statusUpdateRequest, Long userId) {
        // Create the tracking entry
        ShipmentTracking tracking = new ShipmentTracking();
        tracking.setOrder(order);
        tracking.setStatus(statusUpdateRequest.getStatus());
        tracking.setLocation(statusUpdateRequest.getLocation());
        tracking.setNotes(statusUpdateRequest.getNotes());
        tracking.setCreatedBy(userId);
        
        // Add coordinates if available
        if (statusUpdateRequest.getLatitude() != null) {
            tracking.setLatitude(statusUpdateRequest.getLatitude());
        }
        
        if (statusUpdateRequest.getLongitude() != null) {
            tracking.setLongitude(statusUpdateRequest.getLongitude());
        }
        
        return shipmentTrackingRepository.save(tracking);
    }

    @Override
    public List<ShipmentTracking> getTrackingHistoryByOrderId(Long orderId) {
        // Get tracking history sorted by creation time
        return shipmentTrackingRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }

    @Override
    public ShipmentTracking getCurrentStatus(Long orderId) {
        // Get the most recent tracking entry
        return shipmentTrackingRepository.findFirstByOrderIdOrderByCreatedAtDesc(orderId);
    }

    @Override
    public List<ShipmentTracking> getShipperAssignments(Long shipperId) {
        // Get all tracking entries created by a specific shipper
        return shipmentTrackingRepository.findByCreatedByOrderByCreatedAtDesc(shipperId);
    }
} 