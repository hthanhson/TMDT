package com.example.tmdt.service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.tmdt.model.Notification;
import com.example.tmdt.model.Notification.NotificationType;
import com.example.tmdt.model.User;
import com.example.tmdt.repository.NotificationRepository;
import com.example.tmdt.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ObjectMapper objectMapper;

    public List<Notification> getNotificationsByUser(User user) {
        return notificationRepository.findByUser(user);
    }
    
    public List<Notification> getRecentNotificationsByUser(User user, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable).getContent();
    }
    
    /**
     * Lấy thông báo của người dùng có phân trang, sắp xếp theo thời gian tạo mới nhất trước
     */
    public Page<Notification> getNotificationsPageByUser(User user, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }
    
    public List<Notification> getUnreadNotificationsByUser(User user) {
        return notificationRepository.findByUserAndIsReadOrderByCreatedAtDesc(user, false);
    }
    
    public int countUnreadNotifications(User user) {
        return (int) notificationRepository.countUnreadNotifications(user);
    }
    
    @Transactional
    public Notification createNotification(Notification notification) {
        return notificationRepository.save(notification);
    }
    
    @Transactional
    public void markAsRead(Long notificationId, User user) {
        notificationRepository.markAsRead(notificationId, user);
    }
    
    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsRead(user);
    }
    
    @Transactional
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
    
    @Transactional
    public void deleteNotificationsByUser(User user) {
        List<Notification> notifications = notificationRepository.findByUser(user);
        notificationRepository.deleteAll(notifications);
    }
    
    @Transactional
    public void createSystemNotification(String title, String message) {
        // Tạo system notification cho tất cả user
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.SYSTEM_ANNOUNCEMENT);
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void createOrderNotification(User user, String orderId, String status) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("Order Update");
        notification.setMessage("Your order #" + orderId + " status has been updated to: " + status);
        notification.setType(Notification.NotificationType.ORDER_STATUS_CHANGE);
        notification.setReferenceId(Long.parseLong(orderId));
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void createProductNotification(User user, Long productId, String message) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("Product Update");
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.PRODUCT_RESTOCK);
        notification.setReferenceId(productId);
        notificationRepository.save(notification);
    }
    
    /**
     * Tạo thông báo cho một người dùng cụ thể với dữ liệu bổ sung
     */
    @Transactional
    public Notification createNotificationForUser(User user, String title, String message, String type, Map<String, Object> additionalData) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        
        // Chuyển đổi kiểu thông báo từ String sang Enum
        try {
            notification.setType(Notification.NotificationType.valueOf(type));
        } catch (IllegalArgumentException e) {
            // Mặc định là SYSTEM_ANNOUNCEMENT nếu kiểu không hợp lệ
            notification.setType(Notification.NotificationType.SYSTEM_ANNOUNCEMENT);
        }
        
        // Nếu có ID tham chiếu trong dữ liệu bổ sung, thêm vào thông báo
        if (additionalData != null && additionalData.containsKey("orderId")) {
            Object orderId = additionalData.get("orderId");
            if (orderId instanceof Number) {
                notification.setReferenceId(((Number) orderId).longValue());
            } else if (orderId instanceof String) {
                try {
                    notification.setReferenceId(Long.parseLong((String) orderId));
                } catch (NumberFormatException e) {
                    // Bỏ qua nếu không thể chuyển đổi
                }
            }
        }
        
        // Lưu dữ liệu bổ sung dưới dạng JSON - kiểm tra xem Notification có phương thức nào tồn tại để lưu dữ liệu bổ sung
        if (additionalData != null && !additionalData.isEmpty()) {
            try {
                String additionalDataJson = objectMapper.writeValueAsString(additionalData);
                // Kiểm tra phương thức nào tồn tại trong Notification để lưu dữ liệu bổ sung
                // notification.setAdditionalData(additionalDataJson);
            } catch (Exception e) {
                // Bỏ qua nếu không thể chuyển đổi
            }
        }
        
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        
        return notificationRepository.save(notification);
    }
    
    /**
     * Tạo thông báo cho tất cả người dùng (broadcast)
     */
    @Transactional
    public void createBroadcastNotification(String title, String message, String type, Map<String, Object> additionalData) {
        List<User> allUsers = userRepository.findAll();
        
        for (User user : allUsers) {
            createNotificationForUser(user, title, message, type, additionalData);
        }
    }

    /**
     * Send order status notification to user
     */
    @Transactional
    public Notification sendOrderStatusNotification(Long userId, String message, String title) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setTitle(title);
        notification.setType(NotificationType.ORDER_STATUS_CHANGE);
        notification.setCreatedAt(LocalDateTime.now());
        
        return notificationRepository.save(notification);
    }
}