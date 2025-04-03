package com.example.tmdt.service;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.OrderItem;
import com.example.tmdt.model.Product;
import com.example.tmdt.model.User;
import com.example.tmdt.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.tmdt.payload.request.OrderItemRequest;
import com.example.tmdt.payload.request.OrderRequest;

@Service
@Transactional
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final ProductService productService;
    
    @Autowired
    public OrderService(OrderRepository orderRepository, ProductService productService) {
        this.orderRepository = orderRepository;
        this.productService = productService;
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
        order.setTotalAmount(total);
        
        return orderRepository.save(order);
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