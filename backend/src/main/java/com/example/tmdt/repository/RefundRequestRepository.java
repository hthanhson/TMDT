package com.example.tmdt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.RefundRequest;
import com.example.tmdt.model.User;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {
    Optional<RefundRequest> findByOrderId(Long orderId);
    List<RefundRequest> findByStatus(RefundRequest.RefundStatus status);
    List<RefundRequest> findByOrderUser(User user);
    List<RefundRequest> findByOrderUserOrderByCreatedAtDesc(User user);
    boolean existsByOrder(Order order);
} 