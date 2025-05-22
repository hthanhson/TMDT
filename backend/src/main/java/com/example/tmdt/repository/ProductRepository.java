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
    
    @Query("SELECT p FROM Product p WHERE p.category.name = :categoryName")
    List<Product> findByCategoryName(@Param("categoryName") String categoryName);
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.category.name) = LOWER(:categoryName)")
    List<Product> findByCategoryNameIgnoreCase(@Param("categoryName") String categoryName);
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.category.name) = LOWER(:categoryName) AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Product> findByCategoryNameIgnoreCaseAndNameContainingIgnoreCase(
            @Param("categoryName") String categoryName, 
            @Param("query") String query);
} 