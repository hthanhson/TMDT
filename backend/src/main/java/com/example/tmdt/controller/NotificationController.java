package com.example.tmdt.controller;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.example.tmdt.model.Notification;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Order;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.service.NotificationService;
import com.example.tmdt.service.UserService;
import com.example.tmdt.service.OrderService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.example.tmdt.repository.UserRepository;
import com.example.tmdt.security.services.UserDetailsImpl;
import org.springframework.data.domain.Page;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OrderService orderService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;
    
    // Lấy tất cả thông báo của người dùng
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getAllNotifications(@AuthenticationPrincipal User user) {
        List<Notification> notifications = notificationService.getNotificationsByUser(user);
        return ResponseEntity.ok(notifications);
    }
    
    // Lấy thông báo của người dùng có phân trang, mỗi trang 10 thông báo, sắp xếp mới nhất trước
    @GetMapping("/paginated")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getPaginatedNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<Notification> notificationsPage = notificationService.getNotificationsPageByUser(user, page, size);
        
        return ResponseEntity.ok(notificationsPage);
    }
    
    // Lấy các thông báo gần đây
    @GetMapping("/recent")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getRecentNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "5") int limit) {
        
        List<Notification> notifications = notificationService.getRecentNotificationsByUser(user, limit);
        return ResponseEntity.ok(notifications);
    }
    
    // Lấy các thông báo chưa đọc
    @GetMapping("/unread")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUnreadNotifications(@AuthenticationPrincipal User user) {
        List<Notification> notifications = notificationService.getUnreadNotificationsByUser(user);
        return ResponseEntity.ok(notifications);
    }
    
    // Đếm số lượng thông báo chưa đọc
    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal User user) {
        int count = notificationService.countUnreadNotifications(user);
        return ResponseEntity.ok(count);
    }
    
    // Đánh dấu một thông báo là đã đọc
    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok(new MessageResponse("Notification marked as read"));
    }
    
    // Đánh dấu tất cả thông báo của người dùng là đã đọc
    @PutMapping("/read-all")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read"));
    }
    
    // Xóa một thông báo
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotification(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(new MessageResponse("Notification deleted successfully"));
    }
    
    // Xóa tất cả thông báo của người dùng
    @DeleteMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAllNotifications(@AuthenticationPrincipal User user) {
        notificationService.deleteNotificationsByUser(user);
        return ResponseEntity.ok(new MessageResponse("All notifications deleted successfully"));
    }
    
    // Tạo thông báo hệ thống (chỉ admin)
    @PostMapping("/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createSystemNotification(
            @RequestParam String title,
            @RequestParam String message) {
        
        notificationService.createSystemNotification(title, message);
        return ResponseEntity.ok(new MessageResponse("System notification created successfully"));
    }
    
    // API mới: Tạo thông báo khi đơn hàng đặt thành công
    @PostMapping("/order-success")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createOrderSuccessNotification(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User user) {
        
        Long orderId = Long.valueOf(payload.get("orderId").toString());
        Double totalAmount = Double.valueOf(payload.get("totalAmount").toString());
        
        // Tạo thông báo
        String title = "Đặt hàng thành công";
        String message = String.format("Đơn hàng #%d của bạn đã được đặt thành công. Tổng tiền: %.2f VND. Cảm ơn bạn đã mua sắm!", 
                orderId, totalAmount);
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", orderId);
        additionalData.put("totalAmount", totalAmount);
        
        notificationService.createNotificationForUser(user, title, message, "ORDER_STATUS_CHANGE", additionalData);
        
        return ResponseEntity.ok(new MessageResponse("Order success notification created"));
    }
    
    // API mới: Tạo thông báo khi đơn hàng bị hủy
    @PostMapping("/order-cancelled")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createOrderCancelledNotification(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal User user) {
        
        Long orderId = Long.valueOf(payload.get("orderId").toString());
        String reason = (String) payload.get("reason");
        
        // Tạo thông báo
        String title = "Đơn hàng đã bị hủy";
        String message = String.format("Đơn hàng #%d của bạn đã bị hủy. Lý do: %s", 
                orderId, reason);
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", orderId);
        additionalData.put("reason", reason);
        
        notificationService.createNotificationForUser(user, title, message, "ORDER_STATUS_CHANGE", additionalData);
        
        return ResponseEntity.ok(new MessageResponse("Order cancelled notification created"));
    }
    
    // API mới: Tạo thông báo khi người dùng nhận được mã giảm giá
    @PostMapping("/coupon-received")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createCouponReceivedNotification(
            @RequestBody Map<String, Object> payload) {
        
        String couponCode = (String) payload.get("couponCode");
        Long userId = Long.valueOf(payload.get("userId").toString());
        
        // Tìm người dùng
        User targetUser = userService.getUserById(userId);
        if (targetUser == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("User not found"));
        }
        
        // Tạo thông báo
        String title = "Bạn đã nhận được mã giảm giá";
        String message = String.format("Bạn đã nhận được mã giảm giá %s. Hãy sử dụng mã này khi thanh toán để nhận ưu đãi!", 
                couponCode);
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("couponCode", couponCode);
        
        notificationService.createNotificationForUser(targetUser, title, message, "PROMOTION", additionalData);
        
        return ResponseEntity.ok(new MessageResponse("Coupon notification created"));
    }
    
    // API mới: Tạo thông báo cho nhiều người dùng khi admin phát hành mã giảm giá mới
    @PostMapping("/coupon-broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> broadcastCouponNotification(
            @RequestBody Map<String, Object> payload) {
        
        String couponCode = (String) payload.get("couponCode");
        String description = (String) payload.get("description");
        
        // Tạo thông báo
        String title = "Mã giảm giá mới";
        String message = String.format("Mã giảm giá mới: %s - %s", couponCode, description);
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("couponCode", couponCode);
        additionalData.put("description", description);
        
        notificationService.createBroadcastNotification(title, message, "PROMOTION", additionalData);
        
        return ResponseEntity.ok(new MessageResponse("Coupon broadcast notification created"));
    }

    @MessageMapping("/notification")
    public void sendNotification(@Payload Notification notification) {
        // Send to specific user
        if (notification.getUser() != null) {
            messagingTemplate.convertAndSendToUser(
                    notification.getUser().getId().toString(),
                    "/queue/notifications", 
                    notification);
        }
    }

    @GetMapping("/api/notifications")
    public ResponseEntity<List<Notification>> getUserNotifications() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Notification> notifications = notificationService.getNotificationsByUser(user);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/api/notifications/unread-count")
    public ResponseEntity<Map<String, Integer>> getUnreadCount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        int count = notificationService.countUnreadNotifications(user);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/api/notifications/mark-read/{id}")
    public ResponseEntity<Map<String, Boolean>> markAsRead(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/api/notifications/mark-all-read")
    public ResponseEntity<Map<String, Boolean>> markAllAsRead() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(Map.of("success", true));
    }
}