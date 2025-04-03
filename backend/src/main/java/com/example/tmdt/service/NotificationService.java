package com.example.tmdt.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.tmdt.model.Notification;
import com.example.tmdt.model.User;
import com.example.tmdt.repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getNotificationsByUser(User user) {
        return notificationRepository.findByUser(user);
    }
    
    public List<Notification> getRecentNotificationsByUser(User user, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable).getContent();
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
} 