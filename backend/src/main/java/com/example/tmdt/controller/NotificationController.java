package com.example.tmdt.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.tmdt.model.Notification;
import com.example.tmdt.model.User;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.service.NotificationService;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;
    
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getAllNotifications(@AuthenticationPrincipal User user) {
        List<Notification> notifications = notificationService.getNotificationsByUser(user);
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/recent")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getRecentNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "5") int limit) {
        
        List<Notification> notifications = notificationService.getRecentNotificationsByUser(user, limit);
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/unread")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUnreadNotifications(@AuthenticationPrincipal User user) {
        List<Notification> notifications = notificationService.getUnreadNotificationsByUser(user);
        return ResponseEntity.ok(notifications);
    }
    
    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal User user) {
        int count = notificationService.countUnreadNotifications(user);
        return ResponseEntity.ok(count);
    }
    
    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        
        notificationService.markAsRead(id, user);
        return ResponseEntity.ok(new MessageResponse("Notification marked as read"));
    }
    
    @PutMapping("/read-all")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read"));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteNotification(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        
        notificationService.deleteNotification(id);
        return ResponseEntity.ok(new MessageResponse("Notification deleted successfully"));
    }
    
    @DeleteMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAllNotifications(@AuthenticationPrincipal User user) {
        notificationService.deleteNotificationsByUser(user);
        return ResponseEntity.ok(new MessageResponse("All notifications deleted successfully"));
    }
    
    @PostMapping("/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createSystemNotification(
            @RequestParam String title,
            @RequestParam String message) {
        
        notificationService.createSystemNotification(title, message);
        return ResponseEntity.ok(new MessageResponse("System notification created successfully"));
    }
} 