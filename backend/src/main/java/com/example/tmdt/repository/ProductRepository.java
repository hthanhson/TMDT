package com.example.tmdt.repository;

import com.example.tmdt.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import javax.persistence.LockModeType;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(String category);
    
    @Query("SELECT p FROM Product p WHERE p.name LIKE %:query% OR p.description LIKE %:query%")
    List<Product> search(@Param("query") String query);
    
    List<Product> findByPriceBetween(double minPrice, double maxPrice);
    
    List<Product> findTop10ByOrderByAverageRatingDesc();
    
    List<Product> findByStockGreaterThan(int minStock);
    
    List<Product> findTop10ByOrderBySoldCountDesc();
    
    List<Product> findByCategory_IdAndIdNot(Long categoryId, Long productId);
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Product findByIdWithLock(@Param("id") Long id);
} 