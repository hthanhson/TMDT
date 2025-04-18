package com.example.tmdt.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonIdentityInfo;
import com.fasterxml.jackson.annotation.ObjectIdGenerators;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"orderItems", "user"})
@JsonIdentityInfo(
        generator = ObjectIdGenerators.PropertyGenerator.class,
        property = "id")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "shipping_address", nullable = false)
    private String shippingAddress;

    @Column(name = "billing_address")
    private String billingAddress;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "recipient_name", nullable = false)
    private String recipientName;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_status")
    private String paymentStatus;

    @Column(name = "shipper_id")
    private Long shipperId;

    @Column(name = "shipping_fee")
    private BigDecimal shippingFee;

    @Column(name = "estimated_delivery_date")
    private LocalDateTime estimatedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private LocalDateTime actualDeliveryDate;

    @Column(name = "tracking_number")
    private String trackingNumber;

    @Column(name = "notes")
    private String notes;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> orderItems = new ArrayList<>();

    @Transient
    private List<ShipmentTracking> trackingHistory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;
    
    @Column(name = "discount_amount")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) {
            status = OrderStatus.PENDING;
        }
        if (paymentStatus == null) {
            paymentStatus = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addOrderItem(OrderItem orderItem) {
        orderItems.add(orderItem);
        orderItem.setOrder(this);
        calculateTotal();
    }

    public void removeOrderItem(OrderItem orderItem) {
        orderItems.remove(orderItem);
        orderItem.setOrder(null);
        calculateTotal();
    }

    public BigDecimal calculateTotal() {
        BigDecimal subtotal = orderItems.stream()
                .map(item -> item.getPrice().multiply(new BigDecimal(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (discountAmount != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            if (discountAmount.compareTo(subtotal) > 0) {
                discountAmount = subtotal;
            }
            this.totalAmount = subtotal.subtract(discountAmount);
        } else {
            this.totalAmount = subtotal;
        }
        return subtotal;
    }

    public enum OrderStatus {
        PENDING,            // Chờ xác nhận
        CONFIRMED,          // Đã xác nhận
        PROCESSING,         // Đang xử lý
        READY_TO_SHIP,      // Sẵn sàng giao hàng
        PICKED_UP,          // Đã lấy hàng
        IN_TRANSIT,         // Đang vận chuyển
        ARRIVED_AT_STATION, // Đến trạm trung chuyển
        OUT_FOR_DELIVERY,   // Đang giao hàng
        DELIVERED,          // Đã giao hàng
        COMPLETED,          // Hoàn tất
        CANCELLED,          // Đã hủy
        RETURNED            // Hoàn trả
    }

    public Order(Long userId, BigDecimal totalAmount, String shippingAddress, 
                String billingAddress, String phoneNumber, String recipientName) {
        this.userId = userId;
        this.totalAmount = totalAmount;
        this.shippingAddress = shippingAddress;
        this.billingAddress = billingAddress;
        this.phoneNumber = phoneNumber;
        this.recipientName = recipientName;
        this.status = OrderStatus.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void updateStatus(OrderStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
        
        if (newStatus == OrderStatus.DELIVERED) {
            this.actualDeliveryDate = LocalDateTime.now();
        }
    }

    public void assignShipper(Long shipperId) {
        this.shipperId = shipperId;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void setUser(User user) {
        this.user = user;
        this.userId = user.getId();
    }
    
    public User getUser() {
        return this.user;
    }
} 