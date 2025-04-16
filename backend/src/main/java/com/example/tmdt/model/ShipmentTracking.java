package com.example.tmdt.model;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.Order.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;


@Entity
@Table(name = "shipment_tracking")
@Data
@NoArgsConstructor
public class ShipmentTracking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;
    
    private String location;
    
    private String notes;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    private Double latitude;
    
    private Double longitude;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    public ShipmentTracking(Long id, Order order, OrderStatus status, String location, String notes, Long createdBy, LocalDateTime createdAt) {
        this.id = id;
        this.order = order;
        this.status = status;
        this.location = location;
        this.notes = notes;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
    
    /**
     * Constructor for convenient creation of ShipmentTracking from orderId instead of Order object
     */
    public ShipmentTracking(Long orderId, OrderStatus status, String location, String notes, Long createdBy) {
        Order order = new Order();
        order.setId(orderId);
        this.order = order;
        this.status = status;
        this.location = location;
        this.notes = notes;
        this.createdBy = createdBy;
    }
    
    /**
     * Constructor taking an external OrderStatus and converting it
     */
    public ShipmentTracking(Long orderId, com.example.tmdt.model.OrderStatus externalStatus, String location, String notes, Long createdBy) {
        Order order = new Order();
        order.setId(orderId);
        this.order = order;
        // Convert the external OrderStatus to internal OrderStatus
        this.status = OrderStatus.valueOf(externalStatus.name());
        this.location = location;
        this.notes = notes;
        this.createdBy = createdBy;
    }
    
    /**
     * Constructor with location coordinates
     */
    public ShipmentTracking(Long orderId, OrderStatus status, String location, String notes, Long createdBy, Double latitude, Double longitude) {
        Order order = new Order();
        order.setId(orderId);
        this.order = order;
        this.status = status;
        this.location = location;
        this.notes = notes;
        this.createdBy = createdBy;
        this.latitude = latitude;
        this.longitude = longitude;
    }
    
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
} 