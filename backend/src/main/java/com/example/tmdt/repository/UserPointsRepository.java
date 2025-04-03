package com.example.tmdt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Pageable;

import com.example.tmdt.model.User;
import com.example.tmdt.model.UserPoints;
import com.example.tmdt.model.UserPoints.LoyaltyTier;

@Repository
public interface UserPointsRepository extends JpaRepository<UserPoints, Long> {
    
    Optional<UserPoints> findByUser(User user);
    
    List<UserPoints> findByLoyaltyTier(LoyaltyTier loyaltyTier);
    
    @Query("SELECT up FROM UserPoints up WHERE up.currentPoints >= ?1 ORDER BY up.currentPoints DESC")
    List<UserPoints> findUsersWithMinimumPoints(int minPoints);
    
    @Query("SELECT up FROM UserPoints up ORDER BY up.totalEarnedPoints DESC")
    List<UserPoints> findTopUsersByTotalPoints();
    
    @Query("SELECT up FROM UserPoints up ORDER BY up.totalEarnedPoints DESC")
    List<UserPoints> findTopUsersByTotalEarnedPoints(Pageable pageable);
} 