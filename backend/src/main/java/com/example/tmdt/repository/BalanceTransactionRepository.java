package com.example.tmdt.repository;

import com.example.tmdt.model.BalanceTransaction;
import com.example.tmdt.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BalanceTransactionRepository extends JpaRepository<BalanceTransaction, Long> {
    List<BalanceTransaction> findByUser(User user);
    List<BalanceTransaction> findByUserId(Long userId);
    Page<BalanceTransaction> findByUserOrderByTransactionDateDesc(User user, Pageable pageable);
    Page<BalanceTransaction> findByUserIdOrderByTransactionDateDesc(Long userId, Pageable pageable);
    List<BalanceTransaction> findByUserAndTransactionDateBetween(User user, LocalDateTime start, LocalDateTime end);
} 