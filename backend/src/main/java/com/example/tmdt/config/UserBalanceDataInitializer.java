package com.example.tmdt.config;

import com.example.tmdt.model.BalanceTransaction;
import com.example.tmdt.model.User;
import com.example.tmdt.model.UserBalance;
import com.example.tmdt.repository.BalanceTransactionRepository;
import com.example.tmdt.repository.UserBalanceRepository;
import com.example.tmdt.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Configuration
@Profile("dev") // Only run in development mode
public class UserBalanceDataInitializer {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserBalanceRepository userBalanceRepository;

    @Autowired
    private BalanceTransactionRepository balanceTransactionRepository;

    @Bean
    CommandLineRunner initUserBalanceData() {
        return args -> {
            // Check if data already exists
            if (userBalanceRepository.count() > 0) {
                return; // Skip initialization if data already exists
            }

            // For each user in the database, create a balance and some transactions
            userRepository.findAll().forEach(user -> {
                initializeUserBalance(user);
            });
        };
    }

    private void initializeUserBalance(User user) {
        // Create balance with initial amount based on user ID
        BigDecimal initialBalance = BigDecimal.valueOf(500000 + (user.getId() * 100000));
        LocalDateTime now = LocalDateTime.now();

        UserBalance userBalance = new UserBalance();
        userBalance.setUser(user);
        userBalance.setBalance(initialBalance);
        userBalance.setLastDepositDate(now);
        userBalance.setCreatedAt(now);
        userBalance.setUpdatedAt(now);

        userBalance = userBalanceRepository.save(userBalance);

        // Create initial deposit transaction
        BalanceTransaction depositTransaction = new BalanceTransaction();
        depositTransaction.setUser(user);
        depositTransaction.setAmount(initialBalance);
        depositTransaction.setType(BalanceTransaction.TransactionType.DEPOSIT);
        depositTransaction.setDescription("Initial balance setup");
        depositTransaction.setBalanceAfter(initialBalance);
        depositTransaction.setTransactionDate(now);
        balanceTransactionRepository.save(depositTransaction);

        // Create a sample purchase transaction if balance is sufficient
        if (initialBalance.compareTo(BigDecimal.valueOf(200000)) > 0) {
            BigDecimal purchaseAmount = BigDecimal.valueOf(150000);
            BigDecimal remainingBalance = initialBalance.subtract(purchaseAmount);
            
            BalanceTransaction purchaseTransaction = new BalanceTransaction();
            purchaseTransaction.setUser(user);
            purchaseTransaction.setAmount(purchaseAmount.negate());
            purchaseTransaction.setType(BalanceTransaction.TransactionType.ORDER_PAYMENT);
            purchaseTransaction.setDescription("Sample purchase");
            purchaseTransaction.setReferenceId(user.getId() + 100L); // Fake order ID
            purchaseTransaction.setReferenceType("ORDER");
            purchaseTransaction.setBalanceAfter(remainingBalance);
            purchaseTransaction.setTransactionDate(now.plusDays(1));
            balanceTransactionRepository.save(purchaseTransaction);
            
            // Update user balance after purchase
            userBalance.setBalance(remainingBalance);
            userBalance.setUpdatedAt(now.plusDays(1));
            userBalanceRepository.save(userBalance);
        }
    }
} 