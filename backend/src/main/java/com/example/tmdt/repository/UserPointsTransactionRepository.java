package com.example.tmdt.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.User;
import com.example.tmdt.model.UserPointsTransaction;

@Repository
public interface UserPointsTransactionRepository extends JpaRepository<UserPointsTransaction, Long> {
    
    List<UserPointsTransaction> findByUser(User user);
    
    List<UserPointsTransaction> findByUserOrderByCreatedAtDesc(User user);
    
    List<UserPointsTransaction> findByUserAndType(User user, String type);
    
    List<UserPointsTransaction> findByUserAndCreatedAtBetween(User user, LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT SUM(upt.points) FROM UserPointsTransaction upt WHERE upt.user = ?1 AND upt.type = 'EARNED'")
    Long sumEarnedPoints(User user);
    
    @Query("SELECT SUM(upt.points) FROM UserPointsTransaction upt WHERE upt.user = ?1 AND upt.type = 'SPENT'")
    Long sumSpentPoints(User user);
    
    @Query("SELECT upt FROM UserPointsTransaction upt WHERE upt.user = ?1 AND upt.referenceId = ?2")
    List<UserPointsTransaction> findByUserAndReferenceId(User user, Long referenceId);
} 