package com.example.tmdt.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.tmdt.model.LoyaltyTier;
import com.example.tmdt.model.User;
import com.example.tmdt.model.UserPoints;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.service.LoyaltyTierService;
import com.example.tmdt.service.UserPointsService;

@RestController
@RequestMapping("/points")
public class UserPointsController {

    @Autowired
    private UserPointsService userPointsService;
    
    @Autowired
    private LoyaltyTierService loyaltyTierService;
    
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserPoints(@AuthenticationPrincipal User user) {
        UserPoints userPoints = userPointsService.getUserPoints(user);
        return ResponseEntity.ok(userPoints);
    }
    
    @GetMapping("/summary")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getPointsSummary(@AuthenticationPrincipal User user) {
        UserPoints userPoints = userPointsService.getUserPoints(user);
        
        // Convert internal tier to external tier 
        LoyaltyTier currentTier = loyaltyTierService.getTierByName(userPoints.getLoyaltyTier().name());
        
        LoyaltyTier nextTier = loyaltyTierService.getNextTier(currentTier);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("currentPoints", userPoints.getCurrentPoints());
        summary.put("totalEarnedPoints", userPoints.getTotalEarnedPoints());
        summary.put("totalSpentPoints", userPoints.getTotalSpentPoints());
        summary.put("currentTier", currentTier);
        
        if (nextTier != null) {
            int pointsToNextTier = nextTier.getPointThreshold() - userPoints.getTotalEarnedPoints();
            summary.put("nextTier", nextTier);
            summary.put("pointsToNextTier", pointsToNextTier > 0 ? pointsToNextTier : 0);
        }
        
        // Tính toán % giảm giá hiện tại dựa trên tier
        double discountPercentage = userPointsService.calculateDiscountPercentage(user);
        summary.put("discountPercentage", discountPercentage);
        
        return ResponseEntity.ok(summary);
    }
    
    @GetMapping("/history")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getPointsHistory(@AuthenticationPrincipal User user) {
        List<Map<String, Object>> history = userPointsService.getPointsTransactionHistory(user);
        return ResponseEntity.ok(history);
    }
    
    @PostMapping("/redeem")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> redeemPoints(
            @AuthenticationPrincipal User user,
            @RequestParam int points) {
        
        try {
            UserPoints updatedPoints = userPointsService.usePoints(user, points);
            return ResponseEntity.ok(new MessageResponse("Successfully redeemed " + points + " points"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/leaderboard")
    public ResponseEntity<?> getLeaderboard(@RequestParam(defaultValue = "10") int limit) {
        List<UserPoints> topUsers = userPointsService.getTopUsersByPoints(limit);
        return ResponseEntity.ok(topUsers);
    }
    
    @GetMapping("/tiers")
    public ResponseEntity<?> getAllTiers() {
        List<LoyaltyTier> tiers = loyaltyTierService.getAllTiers();
        return ResponseEntity.ok(tiers);
    }
    
    @GetMapping("/tiers/{name}")
    public ResponseEntity<?> getTierByName(@PathVariable String name) {
        try {
            LoyaltyTier tier = loyaltyTierService.getTierByName(name);
            return ResponseEntity.ok(tier);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
} 