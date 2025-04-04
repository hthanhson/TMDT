package com.example.tmdt.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.Coupon;
import com.example.tmdt.model.User;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    
    Optional<Coupon> findByCode(String code);
    
    boolean existsByCode(String code);
    
    List<Coupon> findByUser(User user);
    
    List<Coupon> findByIsActiveAndExpiryDateAfter(boolean isActive, LocalDateTime date);
    
    List<Coupon> findByIsActiveAndExpiryDateBefore(boolean isActive, LocalDateTime date);
    
    List<Coupon> findByUserAndIsActiveAndExpiryDateAfter(User user, boolean isActive, LocalDateTime date);
    
    @Query("SELECT c FROM Coupon c WHERE c.isActive = true AND c.startDate <= ?1 AND c.endDate >= ?1")
    List<Coupon> findAllValidCoupons(LocalDateTime currentTime);
    

    
    @Query("SELECT c FROM Coupon c WHERE c.endDate BETWEEN ?1 AND ?2 AND c.isActive = true")
    List<Coupon> findCouponsExpiringBetween(LocalDateTime start, LocalDateTime end);
} 