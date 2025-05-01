package com.example.tmdt.payload.response;

import com.example.tmdt.model.Order;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private BigDecimal totalAmount;
    private Order.OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String shippingAddress;
    private String billingAddress;
    private String phoneNumber;
    private String recipientName;
    private String paymentMethod;
    private String paymentStatus;
    private BigDecimal shippingFee;
    private LocalDateTime estimatedDeliveryDate;
    private LocalDateTime actualDeliveryDate;
    private String trackingNumber;
    private String notes;
    private List<OrderItemResponse> orderItems;
    private Order.RefundStatus refundStatus;
    
    // Constructor from Order entity
    public OrderResponse(Order order) {
        this.id = order.getId();
        this.userId = order.getUserId();
        if (order.getUser() != null) {
            this.username = order.getUser().getUsername();
            this.fullName = order.getUser().getFullName();
        }
        this.totalAmount = order.getTotalAmount();
        this.status = order.getStatus();
        this.createdAt = order.getCreatedAt();
        this.updatedAt = order.getUpdatedAt();
        this.shippingAddress = order.getShippingAddress();
        this.billingAddress = order.getBillingAddress();
        this.phoneNumber = order.getPhoneNumber();
        this.recipientName = order.getRecipientName();
        this.paymentMethod = order.getPaymentMethod();
        this.paymentStatus = order.getPaymentStatus();
        this.shippingFee = order.getShippingFee();
        this.estimatedDeliveryDate = order.getEstimatedDeliveryDate();
        this.actualDeliveryDate = order.getActualDeliveryDate();
        this.trackingNumber = order.getTrackingNumber();
        this.notes = order.getNotes();
        this.refundStatus = order.getRefundStatus();
    }
    
    // Inner class for OrderItem response
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String productImageUrl;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal totalPrice;
    }
} 