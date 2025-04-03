package com.example.tmdt.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.Notification;
import com.example.tmdt.model.User;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    List<Notification> findByUser(User user);
    
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    List<Notification> findByUserAndIsReadOrderByCreatedAtDesc(User user, boolean isRead);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = ?1 AND n.isRead = false")
    long countUnreadNotifications(User user);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = ?1")
    void markAllAsRead(User user);
    
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = ?1 AND n.user = ?2")
    void markAsRead(Long id, User user);
} 