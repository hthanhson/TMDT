package com.example.tmdt.service;

import com.example.tmdt.model.BalanceTransaction;
import com.example.tmdt.model.User;
import com.example.tmdt.model.UserBalance;
import com.example.tmdt.repository.BalanceTransactionRepository;
import com.example.tmdt.repository.UserBalanceRepository;
import com.example.tmdt.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserBalanceService {

    private final UserBalanceRepository userBalanceRepository;
    private final BalanceTransactionRepository balanceTransactionRepository;
    private final UserRepository userRepository;

    @Autowired
    public UserBalanceService(
            UserBalanceRepository userBalanceRepository,
            BalanceTransactionRepository balanceTransactionRepository,
            UserRepository userRepository) {
        this.userBalanceRepository = userBalanceRepository;
        this.balanceTransactionRepository = balanceTransactionRepository;
        this.userRepository = userRepository;
    }

    /**
     * Get or create user balance for a user
     */
    @Transactional
    public UserBalance getUserBalance(User user) {
        Optional<UserBalance> existingBalance = userBalanceRepository.findByUser(user);
        
        if (existingBalance.isPresent()) {
            return existingBalance.get();
        } else {
            // Initialize a new balance record
            UserBalance newBalance = new UserBalance();
            newBalance.setUser(user);
            newBalance.setBalance(BigDecimal.ZERO);
            newBalance.setCreatedAt(LocalDateTime.now());
            newBalance.setUpdatedAt(LocalDateTime.now());
            return userBalanceRepository.save(newBalance);
        }
    }

    /**
     * Get user balance by user ID
     */
    @Transactional(readOnly = true)
    public UserBalance getUserBalanceByUserId(Long userId) {
        Optional<UserBalance> balanceOpt = userBalanceRepository.findByUserId(userId);
        
        if (balanceOpt.isPresent()) {
            return balanceOpt.get();
        } else {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
            return getUserBalance(user);
        }
    }

    /**
     * Deposit funds to user balance
     */
    @Transactional
    public UserBalance deposit(User user, BigDecimal amount, String description) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be greater than zero");
        }

        UserBalance userBalance = getUserBalance(user);
        BigDecimal oldBalance = userBalance.getBalance();
        
        // Add amount to balance
        userBalance.deposit(amount);
        userBalance = userBalanceRepository.save(userBalance);
        
        // Record transaction
        BalanceTransaction transaction = new BalanceTransaction();
        transaction.setUser(user);
        transaction.setAmount(amount);
        transaction.setType(BalanceTransaction.TransactionType.DEPOSIT);
        transaction.setDescription(description);
        transaction.setBalanceAfter(userBalance.getBalance());
        balanceTransactionRepository.save(transaction);
        
        return userBalance;
    }

    @Transactional
    public UserBalance withdraw(User user, BigDecimal amount, String description) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than zero");
        }

        UserBalance userBalance = getUserBalance(user);
        
        if (userBalance.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance");
        }
        
        // Subtract amount from balance
        userBalance.withdraw(amount);
        userBalance = userBalanceRepository.save(userBalance);
        
        // Record transaction
        BalanceTransaction transaction = new BalanceTransaction();
        transaction.setUser(user);
        transaction.setAmount(amount.negate()); // Negative amount for withdrawal
        transaction.setType(BalanceTransaction.TransactionType.WITHDRAWAL);
        transaction.setDescription(description);
        transaction.setBalanceAfter(userBalance.getBalance());
        balanceTransactionRepository.save(transaction);
        
        return userBalance;
    }


    @Transactional
    public UserBalance processOrderPayment(User user, BigDecimal amount, Long orderId) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero");
        }

        UserBalance userBalance = getUserBalance(user);
        
        if (userBalance.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient balance for order payment");
        }
        
        // Subtract amount from balance
        userBalance.withdraw(amount);
        userBalance = userBalanceRepository.save(userBalance);
        
        // Record transaction
        BalanceTransaction transaction = new BalanceTransaction();
        transaction.setUser(user);
        transaction.setAmount(amount.negate()); // Negative amount for payment
        transaction.setType(BalanceTransaction.TransactionType.ORDER_PAYMENT);
        transaction.setDescription("Payment for order " );
        transaction.setReferenceId(orderId);
        transaction.setReferenceType("ORDER");
        transaction.setBalanceAfter(userBalance.getBalance());
        balanceTransactionRepository.save(transaction);
        
        return userBalance;
    }

    /**
     * Issue refund for cancelled order
     */
    @Transactional
    public UserBalance refundOrderPayment(User user, BigDecimal amount, Long orderId) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Refund amount must be greater than zero");
        }

        UserBalance userBalance = getUserBalance(user);
        
        // Add amount back to balance
        userBalance.deposit(amount);
        userBalance = userBalanceRepository.save(userBalance);
        
        // Record transaction
        BalanceTransaction transaction = new BalanceTransaction();
        transaction.setUser(user);
        transaction.setAmount(amount); // Positive amount for refund
        transaction.setType(BalanceTransaction.TransactionType.REFUND);
        transaction.setDescription("Refund for cancelled order #" + orderId);
        transaction.setReferenceId(orderId);
        transaction.setReferenceType("ORDER");
        transaction.setBalanceAfter(userBalance.getBalance());
        balanceTransactionRepository.save(transaction);
        
        return userBalance;
    }
    
    /**
     * Check if user has sufficient balance for a payment
     */
    @Transactional(readOnly = true)
    public boolean hasSufficientBalance(User user, BigDecimal amount) {
        UserBalance userBalance = getUserBalance(user);
        return userBalance.getBalance().compareTo(amount) >= 0;
    }
    
    /**
     * Get transaction history for a user
     */
    @Transactional(readOnly = true)
    public Page<BalanceTransaction> getTransactionHistory(User user, Pageable pageable) {
        return balanceTransactionRepository.findByUserOrderByTransactionDateDesc(user, pageable);
    }
} 