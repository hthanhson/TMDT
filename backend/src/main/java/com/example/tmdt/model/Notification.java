package com.example.tmdt.model;

import java.time.LocalDateTime;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties("notifications")
    private User user;

    @NotBlank
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum NotificationType {
        ORDER_STATUS_CHANGE,
        PRODUCT_RESTOCK,
        PRODUCT_PRICE_DROP,
        NEW_COUPON,
        POINTS_EARNED,
        POINTS_EXPIRED,
        WISHLIST_PRICE_DROP,
        REVIEW_REPLY,
        SYSTEM_ANNOUNCEMENT
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public static Notification createOrderStatusNotification(User user, Order order) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(NotificationType.ORDER_STATUS_CHANGE);
        notification.setReferenceId(order.getId());
        notification.setTitle("Order Status Updated");
        notification.setMessage("Your order #" + order.getId() + " status has been updated to " + order.getStatus());
        return notification;
    }

    public static Notification createWishlistPriceDropNotification(User user, Product product) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(NotificationType.WISHLIST_PRICE_DROP);
        notification.setReferenceId(product.getId());
        notification.setTitle("Price Drop Alert");
        notification.setMessage("A product in your wishlist is now on sale: " + product.getName());
        return notification;
    }

    public static Notification createPointsEarnedNotification(User user, int points, Order order) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(NotificationType.POINTS_EARNED);
        notification.setReferenceId(order.getId());
        notification.setTitle("Points Earned");
        notification.setMessage("You earned " + points + " points from your order #" + order.getId());
        return notification;
    }
}