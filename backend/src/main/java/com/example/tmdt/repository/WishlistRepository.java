package com.example.tmdt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.Product;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Wishlist;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    
    List<Wishlist> findByUser(User user);
    
    List<Wishlist> findByUserOrderByCreatedAtDesc(User user);
    
    Optional<Wishlist> findByUserAndProduct(User user, Product product);
    
    boolean existsByUserAndProduct(User user, Product product);
    
    void deleteByUserAndProduct(User user, Product product);
    
    List<Wishlist> findByProduct(Product product);
} 