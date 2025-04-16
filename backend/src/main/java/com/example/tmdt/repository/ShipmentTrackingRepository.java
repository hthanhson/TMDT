package com.example.tmdt.repository;

import com.example.tmdt.model.Order.OrderStatus;
import com.example.tmdt.model.ShipmentTracking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShipmentTrackingRepository extends JpaRepository<ShipmentTracking, Long> {
    
    /**
     * Tìm tất cả bản ghi tracking theo order ID, sắp xếp theo thời gian tạo giảm dần (mới nhất trước)
     */
    List<ShipmentTracking> findByOrderIdOrderByCreatedAtDesc(Long orderId);
    
    /**
     * Tìm bản ghi tracking gần nhất theo order ID
     */
    ShipmentTracking findFirstByOrderIdOrderByCreatedAtDesc(Long orderId);
    
    /**
     * Tìm tất cả bản ghi tracking theo status
     */
    List<ShipmentTracking> findByStatus(OrderStatus status);
    
    /**
     * Tìm tất cả bản ghi tracking được tạo bởi một shipper cụ thể
     */
    List<ShipmentTracking> findByCreatedByOrderByCreatedAtDesc(Long shipperId);
} 