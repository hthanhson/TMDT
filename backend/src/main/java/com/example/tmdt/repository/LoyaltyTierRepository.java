package com.example.tmdt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.LoyaltyTier;

@Repository
public interface LoyaltyTierRepository extends JpaRepository<LoyaltyTier, Long> {
    
    Optional<LoyaltyTier> findByName(String name);
    
    Optional<LoyaltyTier> findFirstByOrderByPointThresholdAsc();
    
    Optional<LoyaltyTier> findFirstByOrderByPointThresholdDesc();
    
    List<LoyaltyTier> findAllByOrderByPointThresholdAsc();
    
    List<LoyaltyTier> findAllByOrderByPointThresholdDesc();
    
    List<LoyaltyTier> findByPointThresholdLessThanEqual(Integer points);
    
    Optional<LoyaltyTier> findTopByPointThresholdLessThanEqualOrderByPointThresholdDesc(Integer points);
} 