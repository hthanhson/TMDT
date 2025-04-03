package com.example.tmdt.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.tmdt.model.LoyaltyTier;
import com.example.tmdt.repository.LoyaltyTierRepository;

@Service
public class LoyaltyTierService {

    @Autowired
    private LoyaltyTierRepository loyaltyTierRepository;
    
    public List<LoyaltyTier> getAllTiers() {
        return loyaltyTierRepository.findAllByOrderByPointThresholdAsc();
    }
    
    public LoyaltyTier getTierByName(String name) {
        return loyaltyTierRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Loyalty tier not found with name: " + name));
    }
    
    public LoyaltyTier getTierById(Long id) {
        return loyaltyTierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Loyalty tier not found with id: " + id));
    }
    
    public LoyaltyTier getLowestTier() {
        return loyaltyTierRepository.findFirstByOrderByPointThresholdAsc()
                .orElseThrow(() -> new RuntimeException("No loyalty tier found"));
    }
    
    public LoyaltyTier getHighestTier() {
        return loyaltyTierRepository.findFirstByOrderByPointThresholdDesc()
                .orElseThrow(() -> new RuntimeException("No loyalty tier found"));
    }
    
    /**
     * Lấy tier tiếp theo dựa trên số điểm
     */
    public LoyaltyTier getTierByPoints(int points) {
        return loyaltyTierRepository.findTopByPointThresholdLessThanEqualOrderByPointThresholdDesc(points)
                .orElse(getLowestTier());
    }
    
    /**
     * Lấy tier kế tiếp từ tier hiện tại
     */
    public LoyaltyTier getNextTier(LoyaltyTier currentTier) {
        List<LoyaltyTier> tiers = loyaltyTierRepository.findAllByOrderByPointThresholdAsc();
        
        for (int i = 0; i < tiers.size() - 1; i++) {
            if (tiers.get(i).getId().equals(currentTier.getId())) {
                return tiers.get(i + 1);
            }
        }
        
        // Nếu đã là tier cao nhất, return null
        if (currentTier.getId().equals(getHighestTier().getId())) {
            return null;
        }
        
        return getHighestTier();
    }
    
    @Transactional
    public LoyaltyTier createTier(LoyaltyTier tier) {
        return loyaltyTierRepository.save(tier);
    }
    
    @Transactional
    public LoyaltyTier updateTier(Long id, LoyaltyTier tierDetails) {
        LoyaltyTier tier = getTierById(id);
        
        tier.setName(tierDetails.getName());
        tier.setDescription(tierDetails.getDescription());
        tier.setPointThreshold(tierDetails.getPointThreshold());
        tier.setDiscountPercentage(tierDetails.getDiscountPercentage());
        tier.setPointsMultiplier(tierDetails.getPointsMultiplier());
        tier.setSpecialBenefits(tierDetails.getSpecialBenefits());
        tier.setIconUrl(tierDetails.getIconUrl());
        
        return loyaltyTierRepository.save(tier);
    }
    
    @Transactional
    public void deleteTier(Long id) {
        LoyaltyTier tier = getTierById(id);
        loyaltyTierRepository.delete(tier);
    }
} 