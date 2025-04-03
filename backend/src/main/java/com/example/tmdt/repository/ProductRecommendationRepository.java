package com.example.tmdt.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.tmdt.model.Product;
import com.example.tmdt.model.ProductRecommendation;
import com.example.tmdt.model.ProductRecommendation.RecommendationType;

@Repository
public interface ProductRecommendationRepository extends JpaRepository<ProductRecommendation, Long> {
    
    List<ProductRecommendation> findByProduct(Product product);
    
    List<ProductRecommendation> findByProductOrderByRecommendationScoreDesc(Product product);
    
    List<ProductRecommendation> findByProductAndType(Product product, RecommendationType type);
    
    Optional<ProductRecommendation> findByProductAndRecommendedProductAndType(
            Product product, Product recommendedProduct, RecommendationType type);
    
    @Query("SELECT pr FROM ProductRecommendation pr WHERE pr.product = ?1 AND pr.type = ?2 ORDER BY pr.recommendationScore DESC")
    List<ProductRecommendation> findTopRecommendations(Product product, RecommendationType type);
    
    @Query("SELECT pr FROM ProductRecommendation pr WHERE pr.product IN ?1 AND pr.type = ?2 ORDER BY pr.recommendationScore DESC")
    List<ProductRecommendation> findRecommendedProductsByProductListAndType(
            List<Product> products, RecommendationType type);
} 