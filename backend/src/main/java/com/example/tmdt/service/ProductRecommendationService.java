package com.example.tmdt.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.OrderItem;
import com.example.tmdt.model.Product;
import com.example.tmdt.model.ProductRecommendation;
import com.example.tmdt.model.ProductRecommendation.RecommendationType;
import com.example.tmdt.model.User;
import com.example.tmdt.repository.OrderRepository;
import com.example.tmdt.repository.ProductRecommendationRepository;
import com.example.tmdt.repository.ProductRepository;

@Service
public class ProductRecommendationService {

    @Autowired
    private ProductRecommendationRepository recommendationRepository;
    
    @Autowired
    private ProductRepository productRepository;
    
    @Autowired
    private OrderRepository orderRepository;
    
    // Số lượng sản phẩm gợi ý tối đa
    private static final int MAX_RECOMMENDATIONS = 10;
    
    /**
     * Lấy sản phẩm gợi ý dựa trên sản phẩm hiện tại
     */
    public List<Product> getRecommendedProducts(Product product, int limit) {
        // Lấy danh sách ProductRecommendation
        List<ProductRecommendation> recommendations = 
                recommendationRepository.findByProductOrderByRecommendationScoreDesc(product);
        
        // Chuyển đổi danh sách ProductRecommendation thành danh sách Product
        return recommendations.stream()
                .map(ProductRecommendation::getRecommendedProduct)
                .distinct()
                .limit(limit > 0 ? limit : MAX_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy sản phẩm gợi ý dựa trên loại gợi ý
     */
    public List<Product> getRecommendedProductsByType(Product product, RecommendationType type, int limit) {
        // Lấy danh sách ProductRecommendation dựa trên loại
        List<ProductRecommendation> recommendations = 
                recommendationRepository.findTopRecommendations(product, type);
        
        // Chuyển đổi danh sách ProductRecommendation thành danh sách Product
        return recommendations.stream()
                .map(ProductRecommendation::getRecommendedProduct)
                .distinct()
                .limit(limit > 0 ? limit : MAX_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }
    
    /**
     * Lấy sản phẩm gợi ý dựa trên lịch sử mua hàng của người dùng
     */
    public List<Product> getPersonalizedRecommendations(User user, int limit) {
        // Lấy danh sách sản phẩm đã mua của user
        List<Order> userOrders = orderRepository.findByUser(user);
        List<Product> purchasedProducts = new ArrayList<>();
        
        for (Order order : userOrders) {
            for (OrderItem item : order.getOrderItems()) {
                purchasedProducts.add(item.getProduct());
            }
        }
        
        // Loại bỏ trùng lặp
        purchasedProducts = purchasedProducts.stream()
                .distinct()
                .collect(Collectors.toList());
        
        // Nếu user chưa mua hàng, trả về danh sách sản phẩm phổ biến
        if (purchasedProducts.isEmpty()) {
            return productRepository.findTop10ByOrderBySoldCountDesc();
        }
        
        // Lấy sản phẩm gợi ý dựa trên sản phẩm đã mua
        List<ProductRecommendation> recommendations = 
                recommendationRepository.findRecommendedProductsByProductListAndType(
                        purchasedProducts, RecommendationType.BOUGHT_TOGETHER);
        
        // Lọc bỏ các sản phẩm đã mua
        Set<Long> purchasedProductIds = purchasedProducts.stream()
                .map(Product::getId)
                .collect(Collectors.toSet());
        
        // Chuyển đổi và loại bỏ sản phẩm đã mua
        List<Product> recommendedProducts = recommendations.stream()
                .map(ProductRecommendation::getRecommendedProduct)
                .filter(p -> !purchasedProductIds.contains(p.getId()))
                .distinct()
                .limit(limit > 0 ? limit : MAX_RECOMMENDATIONS)
                .collect(Collectors.toList());
        
        // Nếu không đủ số lượng, bổ sung bằng sản phẩm phổ biến
        if (recommendedProducts.size() < limit) {
            int remainingCount = limit - recommendedProducts.size();
            
            // Lấy danh sách sản phẩm phổ biến
            List<Product> popularProducts = productRepository.findTop10ByOrderBySoldCountDesc();
            
            // Loại bỏ sản phẩm đã mua và đã gợi ý
            Set<Long> recommendedProductIds = recommendedProducts.stream()
                    .map(Product::getId)
                    .collect(Collectors.toSet());
            
            popularProducts = popularProducts.stream()
                    .filter(p -> !purchasedProductIds.contains(p.getId()) && !recommendedProductIds.contains(p.getId()))
                    .limit(remainingCount)
                    .collect(Collectors.toList());
            
            recommendedProducts.addAll(popularProducts);
        }
        
        return recommendedProducts;
    }
    
    /**
     * Cập nhật gợi ý "Mua cùng nhau" sau khi một đơn hàng được tạo
     */
    @Transactional
    public void updateBoughtTogetherRecommendations(Order order) {
        List<Product> productsInOrder = order.getOrderItems().stream()
                .map(OrderItem::getProduct)
                .collect(Collectors.toList());
        
        // Nếu chỉ có 1 sản phẩm, không cần cập nhật
        if (productsInOrder.size() <= 1) {
            return;
        }
        
        // Cập nhật mối quan hệ giữa các sản phẩm trong đơn hàng
        for (Product product : productsInOrder) {
            for (Product otherProduct : productsInOrder) {
                // Không tạo gợi ý cho chính sản phẩm đó
                if (product.equals(otherProduct)) {
                    continue;
                }
                
                // Kiểm tra xem đã có gợi ý này chưa
                ProductRecommendation recommendation = recommendationRepository
                        .findByProductAndRecommendedProductAndType(
                                product, otherProduct, RecommendationType.BOUGHT_TOGETHER)
                        .orElse(new ProductRecommendation());
                
                // Cập nhật hoặc tạo mới
                if (recommendation.getId() == null) {
                    recommendation.setProduct(product);
                    recommendation.setRecommendedProduct(otherProduct);
                    recommendation.setType(RecommendationType.BOUGHT_TOGETHER);
                    recommendation.setRecommendationScore(1.0);
                } else {
                    // Tăng điểm gợi ý
                    recommendation.setRecommendationScore(recommendation.getRecommendationScore() + 1.0);
                }
                
                recommendationRepository.save(recommendation);
            }
        }
    }
    
    /**
     * Cập nhật gợi ý "Xem cùng nhau" khi người dùng xem sản phẩm
     */
    @Transactional
    public void updateViewedTogetherRecommendations(User user, Product currentProduct, Product previousProduct) {
        // Nếu không có sản phẩm trước đó, không cần cập nhật
        if (previousProduct == null || currentProduct.equals(previousProduct)) {
            return;
        }
        
        // Cập nhật mối quan hệ từ sản phẩm trước đến sản phẩm hiện tại
        updateViewRelationship(previousProduct, currentProduct);
        
        // Cập nhật mối quan hệ từ sản phẩm hiện tại đến sản phẩm trước đó
        updateViewRelationship(currentProduct, previousProduct);
    }
    
    private void updateViewRelationship(Product fromProduct, Product toProduct) {
        // Kiểm tra xem đã có gợi ý này chưa
        ProductRecommendation recommendation = recommendationRepository
                .findByProductAndRecommendedProductAndType(
                        fromProduct, toProduct, RecommendationType.VIEWED_TOGETHER)
                .orElse(new ProductRecommendation());
        
        // Cập nhật hoặc tạo mới
        if (recommendation.getId() == null) {
            recommendation.setProduct(fromProduct);
            recommendation.setRecommendedProduct(toProduct);
            recommendation.setType(RecommendationType.VIEWED_TOGETHER);
            recommendation.setRecommendationScore(1.0);
        } else {
            // Tăng điểm gợi ý, nhưng với tỷ lệ nhỏ hơn so với mua cùng nhau
            recommendation.setRecommendationScore(recommendation.getRecommendationScore() + 0.5);
        }
        
        recommendationRepository.save(recommendation);
    }
    
    /**
     * Lấy sản phẩm tương tự dựa trên danh mục và thuộc tính
     */
    public List<Product> getSimilarProducts(Product product, int limit) {
        // Lấy danh mục của sản phẩm
        Long categoryId = product.getCategory().getId();
        
        // Lấy danh sách sản phẩm trong cùng danh mục
        List<Product> productsInSameCategory = 
                productRepository.findByCategory_IdAndIdNot(categoryId, product.getId());
        
        // TODO: Có thể mở rộng tính năng tìm sản phẩm tương tự dựa trên thuộc tính
        
        // Giới hạn số lượng kết quả
        return productsInSameCategory.stream()
                .limit(limit > 0 ? limit : MAX_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }
    
    /**
     * Gộp nhiều danh sách gợi ý thành một
     */
    public List<Product> getMixedRecommendations(Product product, int limit) {
        Set<Product> result = new HashSet<>();
        
        // Lấy gợi ý từ nhiều nguồn khác nhau
        List<Product> boughtTogether = getRecommendedProductsByType(product, RecommendationType.BOUGHT_TOGETHER, limit / 2);
        List<Product> viewedTogether = getRecommendedProductsByType(product, RecommendationType.VIEWED_TOGETHER, limit / 2);
        List<Product> similarProducts = getSimilarProducts(product, limit / 2);
        
        // Thêm vào kết quả theo thứ tự ưu tiên
        result.addAll(boughtTogether);
        
        // Nếu chưa đủ, bổ sung từ viewedTogether
        if (result.size() < limit) {
            viewedTogether.stream()
                    .filter(p -> !result.contains(p))
                    .limit(limit - result.size())
                    .forEach(result::add);
        }
        
        // Nếu vẫn chưa đủ, bổ sung từ similarProducts
        if (result.size() < limit) {
            similarProducts.stream()
                    .filter(p -> !result.contains(p))
                    .limit(limit - result.size())
                    .forEach(result::add);
        }
        
        // Chuyển đổi Set thành List và trả về
        return new ArrayList<>(result);
    }
} 