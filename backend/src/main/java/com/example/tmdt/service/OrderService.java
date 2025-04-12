package com.example.tmdt.service;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.OrderItem;
import com.example.tmdt.model.Product;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Coupon;
import com.example.tmdt.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.example.tmdt.payload.request.OrderItemRequest;
import com.example.tmdt.payload.request.OrderRequest;

@Service
@Transactional
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final CouponService couponService;
    private final NotificationService notificationService;
    
    @Autowired
    public OrderService(
            OrderRepository orderRepository, 
            ProductService productService, 
            CouponService couponService,
            NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.couponService = couponService;
        this.notificationService = notificationService;
    }
    
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id));
    }
    
    public List<Order> getUserOrders(User user) {
        return orderRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    @Transactional
    public Order createOrder(User user, OrderRequest orderRequest) {
        // Create new order
        Order order = new Order();
        order.setUser(user);
        order.setStatus(Order.OrderStatus.PENDING);
        order.setShippingAddress(orderRequest.getShippingAddress());
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        
        // Calculate total and add items
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        
        for (OrderItemRequest itemRequest : orderRequest.getItems()) {
            Product product = productService.getProductById(itemRequest.getProductId());
            
            // Check if there's enough stock
            if (product.getStock() < itemRequest.getQuantity()) {
                throw new RuntimeException("Not enough stock for product: " + product.getName());
            }
            
            // Reduce stock
            product.setStock(product.getStock() - itemRequest.getQuantity());
            productService.updateProduct(product.getId(), product);
            
            // Create order item
            OrderItem orderItem = new OrderItem(product, itemRequest.getQuantity());
            orderItem.setOrder(order);
            orderItems.add(orderItem);
            
            // Add to total
            total = total.add(BigDecimal.valueOf(product.getPrice()).multiply(new BigDecimal(itemRequest.getQuantity())));
        }
        
        order.setOrderItems(orderItems);
        order.calculateTotal(); // Calculate subtotal before applying coupon discount
        
        // Apply coupon if provided
        if (orderRequest.getCouponCode() != null && !orderRequest.getCouponCode().isEmpty()) {
            try {
                Coupon coupon = couponService.verifyCoupon(
                    orderRequest.getCouponCode(), 
                    user, 
                    total.doubleValue()
                );
                
                // Calculate discount
                double discountAmount = 0;
                if (coupon.getDiscountType() == Coupon.DiscountType.PERCENTAGE) {
                    // Calculate percentage discount
                    discountAmount = total.doubleValue() * (coupon.getDiscountValue().doubleValue() / 100.0);
                } else {
                    // Fixed amount discount
                    discountAmount = coupon.getDiscountValue().doubleValue();
                    // Make sure discount doesn't exceed total
                    if (discountAmount > total.doubleValue()) {
                        discountAmount = total.doubleValue();
                    }
                }
                
                // Set coupon and discount amount
                order.setCoupon(coupon);
                order.setDiscountAmount(BigDecimal.valueOf(discountAmount));
                
                // Recalculate total with the applied discount
                order.calculateTotal();
                
                // Mark coupon as used if it's a one-time use coupon
                couponService.useCoupon(orderRequest.getCouponCode());
                
            } catch (Exception e) {
                // If coupon validation fails, continue without applying coupon
                // Consider logging the error or handling it in a different way
            }
        }
        
        // Set the final total amount, prioritizing client-provided total if available
        if (orderRequest.getTotal() != null) {
            // Use the client-provided total that includes the discount
            order.setTotalAmount(BigDecimal.valueOf(orderRequest.getTotal()));
        } else {
            // If no client total is provided, calculate the total with discount
            order.calculateTotal();
        }
        
        Order savedOrder = orderRepository.save(order);
        
        // Create notification for order success
        String title = "Đặt hàng thành công";
        String message = String.format("Đơn hàng #%d của bạn đã được đặt thành công. Tổng tiền: %.2f VND. Cảm ơn bạn đã mua sắm!", 
                savedOrder.getId(), savedOrder.getTotalAmount().doubleValue());
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", savedOrder.getId());
        additionalData.put("totalAmount", savedOrder.getTotalAmount().doubleValue());
        
        notificationService.createNotificationForUser(
            user, 
            title, 
            message, 
            "ORDER_STATUS_CHANGE", 
            additionalData
        );
        
        return savedOrder;
    }
    
    @Transactional
    public Order updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + orderId));
        
        order.setStatus(status);
        
        // If order is cancelled, restore stock
        if (status == Order.OrderStatus.CANCELLED) {
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();
                product.setStock(product.getStock() + item.getQuantity());
                productService.updateProduct(product.getId(), product);
            }
            
            // Create notification for order cancellation
            String title = "Đơn hàng đã bị hủy";
            String message = String.format("Đơn hàng #%d của bạn đã bị hủy.", orderId);
            
            Map<String, Object> additionalData = new HashMap<>();
            additionalData.put("orderId", orderId);
            additionalData.put("reason", "Đơn hàng đã được hủy với trạng thái: " + status);
            
            notificationService.createNotificationForUser(
                order.getUser(), 
                title, 
                message, 
                "ORDER_STATUS_CHANGE", 
                additionalData
            );
        }
        
        return orderRepository.save(order);
    }
    
    public Order updatePaymentStatus(Long id, String paymentStatus) {
        Order order = getOrderById(id);
        order.setPaymentStatus(paymentStatus);
        
        // If payment is completed, update order status to processing
        if ("COMPLETED".equals(paymentStatus)) {
            order.setStatus(Order.OrderStatus.PROCESSING);
        }
        
        return orderRepository.save(order);
    }
    
    public void deleteOrder(Long id) {
        Order order = getOrderById(id);
        orderRepository.delete(order);
    }
    
    public List<Order> getOrdersByStatus(Order.OrderStatus status) {
        return orderRepository.findByStatus(status);
    }
    
    public List<Order> getOrdersByDateRange(LocalDateTime start, LocalDateTime end) {
        return orderRepository.findByCreatedAtBetween(start, end);
    }
} 