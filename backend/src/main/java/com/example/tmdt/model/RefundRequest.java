package com.example.tmdt.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "refund_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"order"})
public class RefundRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "reason", nullable = false, length = 1000)
    private String reason;

    @Column(name = "additional_info", length = 2000)
    private String additionalInfo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RefundStatus status = RefundStatus.REQUESTED;

    @ElementCollection
    @CollectionTable(name = "refund_request_images", 
                    joinColumns = @JoinColumn(name = "refund_request_id"))
    @Column(name = "image_url")
    private List<String> imageUrls = new ArrayList<>();

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) {
            status = RefundStatus.REQUESTED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum RefundStatus {
        REQUESTED,  // Yêu cầu hoàn tiền mới được tạo
        REVIEWING,  // Đang xem xét
        APPROVED,   // Đã chấp nhận hoàn tiền
        REJECTED,   // Từ chối hoàn tiền
        COMPLETED   // Hoàn tiền đã hoàn tất
    }
} 