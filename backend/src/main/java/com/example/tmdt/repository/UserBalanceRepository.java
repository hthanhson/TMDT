package com.example.tmdt.repository;

import com.example.tmdt.model.User;
import com.example.tmdt.model.UserBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserBalanceRepository extends JpaRepository<UserBalance, Long> {
    Optional<UserBalance> findByUser(User user);
    Optional<UserBalance> findByUserId(Long userId);
} 