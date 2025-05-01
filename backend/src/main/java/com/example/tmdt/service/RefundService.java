package com.example.tmdt.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.RefundRequest;
import com.example.tmdt.model.Role;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Order.OrderStatus;
import com.example.tmdt.model.Role.ERole;
import com.example.tmdt.payload.request.RefundRequestDto;
import com.example.tmdt.repository.OrderRepository;
import com.example.tmdt.repository.RefundRequestRepository;
import com.example.tmdt.repository.UserRepository;
import com.example.tmdt.exception.ResourceNotFoundException;

import javax.persistence.EntityNotFoundException;

@Service
public class RefundService {
    
    @Autowired
    private RefundRequestRepository refundRequestRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private UserBalanceService userBalanceService;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Create a new refund request
     */
    @Transactional
    public RefundRequest createRefundRequest(User user, RefundRequestDto requestDto, List<MultipartFile> images) {
        Order order = orderService.getOrderById(requestDto.getOrderId());
        
        // Check if the order belongs to the user
        if (!order.getUserId().equals(user.getId())) {
            throw new IllegalArgumentException("You don't have permission to request a refund for this order");
        }
        
        // Check if the order is eligible for refund (must be DELIVERED or COMPLETED)
        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new IllegalArgumentException("Only delivered or completed orders can be refunded");
        }
        
        // Check if a refund request already exists for this order
        if (refundRequestRepository.existsByOrder(order)) {
            throw new IllegalArgumentException("A refund request already exists for this order");
        }
        
        // Create the refund request
        RefundRequest refundRequest = new RefundRequest();
        refundRequest.setOrder(order);
        refundRequest.setReason(requestDto.getReason());
        refundRequest.setAdditionalInfo(requestDto.getAdditionalInfo());
        refundRequest.setStatus(RefundRequest.RefundStatus.REQUESTED);
        
        // Update order's refund status
        order.setRefundStatus(Order.RefundStatus.REQUESTED);
        orderRepository.save(order);
        
        // Process images if any
        if (images != null && !images.isEmpty()) {
            List<String> imageUrls = images.stream()
                .map(image -> fileStorageService.storeFile(image, "refunds"))
                .collect(Collectors.toList());
            refundRequest.setImageUrls(imageUrls);
        }
        
        // Save the refund request
        RefundRequest savedRequest = refundRequestRepository.save(refundRequest);
        
        // Sửa chỗ này để sử dụng ERole enum thay vì chuỗi
        User adminUser = userRepository.findByRoles_Name(ERole.ROLE_ADMIN).stream().findFirst()
            .orElseThrow(() -> new RuntimeException("Admin user not found"));
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", order.getId());
        
        notificationService.createNotificationForUser(
            adminUser,
            "New Refund Request", 
            "A new refund request has been submitted for order #" + order.getId(), 
            "REFUND_REQUEST",
            additionalData
        );
        
        return savedRequest;
    }
    
    /**
     * Get a refund request by ID
     */
    public RefundRequest getRefundRequestById(Long id) {
        return refundRequestRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Refund request not found with id " + id));
    }
    
    /**
     * Get refund request by order ID
     */
    public Optional<RefundRequest> getRefundRequestByOrderId(Long orderId) {
        return refundRequestRepository.findByOrderId(orderId);
    }
    
    /**
     * Get all refund requests for a user
     */
    public List<RefundRequest> getRefundRequestsByUser(User user) {
        return refundRequestRepository.findByOrderUserOrderByCreatedAtDesc(user);
    }
    
    /**
     * Update refund request status (for admin)
     */
    @Transactional
    public RefundRequest updateRefundRequestStatus(Long id, RefundRequest.RefundStatus status, String adminNotes) {
        RefundRequest refundRequest = getRefundRequestById(id);
        Order order = refundRequest.getOrder();
        
        refundRequest.setStatus(status);
        if (adminNotes != null && !adminNotes.isEmpty()) {
            refundRequest.setAdminNotes(adminNotes);
        }
        
        // Update order refund status
        if (status == RefundRequest.RefundStatus.APPROVED) {
            order.setRefundStatus(Order.RefundStatus.APPROVED);
            
            // Thực hiện hoàn tiền ngay khi yêu cầu được chấp nhận
            if (order.getPaymentMethod().equals("account_balance") || 
                order.getPaymentMethod().equals("credit")) {
                userBalanceService.refundOrderPayment(order.getUser(), order.getTotalAmount(), order.getId());
            }
            
            // Cập nhật trạng thái đơn hàng thành RETURNED
            order.setStatus(OrderStatus.RETURNED);
        } else if (status == RefundRequest.RefundStatus.REJECTED) {
            order.setRefundStatus(Order.RefundStatus.REJECTED);
        } else if (status == RefundRequest.RefundStatus.COMPLETED) {
            order.setRefundStatus(Order.RefundStatus.COMPLETED);
        } else {
            order.setRefundStatus(Order.RefundStatus.REVIEWING);
        }
        
        orderRepository.save(order);
        
        // Create notification for user
        String notificationMessage;
        if (status == RefundRequest.RefundStatus.APPROVED) {
            notificationMessage = "Your refund request for order #" + order.getId() + " has been approved. The refund amount of " + order.getTotalAmount() + " has been credited to your account.";
        } else if (status == RefundRequest.RefundStatus.REJECTED) {
            notificationMessage = "Your refund request for order #" + order.getId() + " has been rejected.";
        } else if (status == RefundRequest.RefundStatus.COMPLETED) {
            notificationMessage = "Your refund for order #" + order.getId() + " has been processed.";
        } else {
            notificationMessage = "Your refund request for order #" + order.getId() + " is under review.";
        }
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", order.getId());
        
        notificationService.createNotificationForUser(
            order.getUser(),
            "Refund Request Update",
            notificationMessage,
            "REFUND_STATUS_CHANGE",
            additionalData
        );
        
        return refundRequestRepository.save(refundRequest);
    }
    
    /**
     * Get all refund requests with a specific status
     */
    public List<RefundRequest> getRefundRequestsByStatus(RefundRequest.RefundStatus status) {
        return refundRequestRepository.findByStatus(status);
    }
    
    /**
     * Get all refund requests (for admin)
     */
    public List<RefundRequest> getAllRefundRequests() {
        return refundRequestRepository.findAll();
    }
} 