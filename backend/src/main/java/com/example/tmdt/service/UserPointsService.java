package com.example.tmdt.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.tmdt.model.LoyaltyTier;
import com.example.tmdt.model.Notification;
import com.example.tmdt.model.Order;
import com.example.tmdt.model.User;
import com.example.tmdt.model.UserPoints;
import com.example.tmdt.model.UserPointsTransaction;
import com.example.tmdt.repository.LoyaltyTierRepository;
import com.example.tmdt.repository.NotificationRepository;
import com.example.tmdt.repository.OrderRepository;
import com.example.tmdt.repository.UserPointsRepository;
import com.example.tmdt.repository.UserPointsTransactionRepository;
import com.example.tmdt.repository.UserRepository;

@Service
public class UserPointsService {

    @Autowired
    private UserPointsRepository userPointsRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private LoyaltyTierRepository loyaltyTierRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private UserPointsTransactionRepository userPointsTransactionRepository;
    
    private static final int POINTS_PER_ORDER_AMOUNT = 10; // 10 điểm cho mỗi 100,000 VND
    
    public UserPoints getUserPoints(User user) {
        return userPointsRepository.findByUser(user)
                .orElse(createNewUserPoints(user));
    }
    
    private UserPoints createNewUserPoints(User user) {
        // Lấy tier thấp nhất
        LoyaltyTier lowestTier = loyaltyTierRepository.findFirstByOrderByPointThresholdAsc()
                .orElseThrow(() -> new RuntimeException("No loyalty tiers found"));
        
        UserPoints userPoints = new UserPoints();
        userPoints.setUser(user);
        userPoints.setLoyaltyTier(convertToInternalLoyaltyTier(lowestTier));
        userPoints.setCurrentPoints(0);
        userPoints.setTotalEarnedPoints(0);
        
        return userPointsRepository.save(userPoints);
    }
    
    @Transactional
    public UserPoints addPointsFromOrder(User user, Order order) {
        UserPoints userPoints = getUserPoints(user);
        
        // Tính điểm dựa trên tổng giá trị đơn hàng
        int pointsToAdd = calculatePointsFromOrderAmount(order.getTotalAmount().doubleValue());
        
        // Cập nhật điểm
        userPoints.setCurrentPoints(userPoints.getCurrentPoints() + pointsToAdd);
        userPoints.setTotalEarnedPoints(userPoints.getTotalEarnedPoints() + pointsToAdd);
        
        // Kiểm tra và cập nhật tier nếu cần
        checkAndUpdateLoyaltyTier(userPoints);
        
        // Lưu giao dịch điểm
        savePointsTransaction(user, pointsToAdd, "EARNED", "Order #" + order.getId(), order.getId());
        
        return userPointsRepository.save(userPoints);
    }
    
    private int calculatePointsFromOrderAmount(double amount) {
        return (int) (amount / 100000 * POINTS_PER_ORDER_AMOUNT);
    }
    
    @Transactional
    public UserPoints usePoints(User user, int pointsToUse) {
        UserPoints userPoints = getUserPoints(user);
        
        if (userPoints.getCurrentPoints() < pointsToUse) {
            throw new RuntimeException("Not enough points available");
        }
        
        userPoints.setCurrentPoints(userPoints.getCurrentPoints() - pointsToUse);
        
        // Lưu giao dịch điểm
        savePointsTransaction(user, pointsToUse, "SPENT", "Points redemption", null);
        
        return userPointsRepository.save(userPoints);
    }
    
    private void savePointsTransaction(User user, int points, String type, String description, Long referenceId) {
        UserPointsTransaction transaction = new UserPointsTransaction();
        transaction.setUser(user);
        transaction.setPoints(points);
        transaction.setType(type);
        transaction.setDescription(description);
        transaction.setReferenceId(referenceId);
        
        userPointsTransactionRepository.save(transaction);
    }
    
    public List<Map<String, Object>> getPointsTransactionHistory(User user) {
        List<UserPointsTransaction> transactions = userPointsTransactionRepository.findByUserOrderByCreatedAtDesc(user);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (UserPointsTransaction transaction : transactions) {
            Map<String, Object> transactionMap = new HashMap<>();
            transactionMap.put("id", transaction.getId());
            transactionMap.put("points", transaction.getPoints());
            transactionMap.put("type", transaction.getType());
            transactionMap.put("description", transaction.getDescription());
            transactionMap.put("date", transaction.getCreatedAt());
            
            // Nếu là giao dịch từ order, lấy thêm thông tin order
            if (transaction.getReferenceId() != null && transaction.getDescription().startsWith("Order")) {
                orderRepository.findById(transaction.getReferenceId()).ifPresent(order -> {
                    transactionMap.put("orderInfo", Map.of(
                        "orderId", order.getId(),
                        "status", order.getStatus(),
                        "totalAmount", order.getTotalAmount()
                    ));
                });
            }
            
            result.add(transactionMap);
        }
        
        return result;
    }
    
    @Transactional
    public void checkAndUpdateLoyaltyTier(UserPoints userPoints) {
        // Lấy danh sách các tier theo thứ tự từ cao đến thấp
        List<LoyaltyTier> tiers = loyaltyTierRepository.findAllByOrderByPointThresholdDesc();
        
        for (LoyaltyTier tier : tiers) {
            if (userPoints.getTotalEarnedPoints() >= tier.getPointThreshold()) {
                // Nếu tier mới khác tier hiện tại, cập nhật và gửi thông báo
                UserPoints.LoyaltyTier internalTier = convertToInternalLoyaltyTier(tier);
                if (!internalTier.equals(userPoints.getLoyaltyTier())) {
                    UserPoints.LoyaltyTier oldTier = userPoints.getLoyaltyTier();
                    userPoints.setLoyaltyTier(internalTier);
                    userPointsRepository.save(userPoints);
                    
                    // Tạo thông báo nâng cấp tier
                    createTierUpgradeNotification(userPoints.getUser(), 
                                                 convertToExternalLoyaltyTier(oldTier), 
                                                 tier);
                }
                break;
            }
        }
    }
    
    private void createTierUpgradeNotification(User user, LoyaltyTier oldTier, LoyaltyTier newTier) {
        // Tạo thông báo cho user khi nâng cấp tier
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("Loyalty Tier Upgrade");
        notification.setMessage("Congratulations! You've been upgraded from " + oldTier.getName() 
                + " to " + newTier.getName() + " tier. Enjoy new benefits!");
        notification.setType(Notification.NotificationType.SYSTEM_ANNOUNCEMENT);
        
        notificationRepository.save(notification);
    }
    
    public List<UserPoints> getTopUsersByPoints(int limit) {
        PageRequest pageRequest = PageRequest.of(0, limit);
        return userPointsRepository.findTopUsersByTotalEarnedPoints(pageRequest);
    }
    
    public List<User> getUsersByLoyaltyTier(UserPoints.LoyaltyTier loyaltyTier) {
        return userPointsRepository.findByLoyaltyTier(loyaltyTier).stream()
                .map(UserPoints::getUser)
                .toList();
    }
    
    public double calculateDiscountPercentage(User user) {
        UserPoints userPoints = getUserPoints(user);
        UserPoints.LoyaltyTier tier = userPoints.getLoyaltyTier();
        LoyaltyTier externalTier = convertToExternalLoyaltyTier(tier);
        
        return externalTier.getDiscountPercentage();
    }
    
    public void updateUserLoyaltyTier(User user, LoyaltyTier loyaltyTier) {
        UserPoints userPoints = getUserPoints(user);
        // Convert external LoyaltyTier to UserPoints.LoyaltyTier
        UserPoints.LoyaltyTier internalTier;
        
        switch(loyaltyTier.getName()) {
            case "GOLD": 
                internalTier = UserPoints.LoyaltyTier.GOLD;
                break;
            case "SILVER": 
                internalTier = UserPoints.LoyaltyTier.SILVER;
                break;
            case "PLATINUM": 
                internalTier = UserPoints.LoyaltyTier.PLATINUM;
                break;
            default: 
                internalTier = UserPoints.LoyaltyTier.BRONZE;
        }
        
        userPoints.setLoyaltyTier(internalTier);
        userPointsRepository.save(userPoints);
    }
    
    public UserPoints.LoyaltyTier getUserLoyaltyTier(User user) {
        UserPoints userPoints = getUserPoints(user);
        return userPoints.getLoyaltyTier();
    }
    
    // Helper method to convert between loyalty tier types
    private LoyaltyTier convertToExternalLoyaltyTier(UserPoints.LoyaltyTier internalTier) {
        LoyaltyTier externalTier = new LoyaltyTier();
        
        switch(internalTier) {
            case GOLD:
                externalTier.setName("GOLD");
                break;
            case SILVER:
                externalTier.setName("SILVER");
                break;
            case PLATINUM:
                externalTier.setName("PLATINUM");
                break;
            default:
                externalTier.setName("BRONZE");
        }
        
        return externalTier;
    }
    
    private UserPoints.LoyaltyTier convertToInternalLoyaltyTier(LoyaltyTier externalTier) {
        if (externalTier == null) return UserPoints.LoyaltyTier.BRONZE;
        
        switch(externalTier.getName()) {
            case "GOLD": 
                return UserPoints.LoyaltyTier.GOLD;
            case "SILVER": 
                return UserPoints.LoyaltyTier.SILVER;
            case "PLATINUM": 
                return UserPoints.LoyaltyTier.PLATINUM;
            default: 
                return UserPoints.LoyaltyTier.BRONZE;
        }
    }
} 