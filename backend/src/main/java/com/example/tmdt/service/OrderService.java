package com.example.tmdt.service;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.OrderItem;
import com.example.tmdt.model.Product;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Coupon;
import com.example.tmdt.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import java.math.RoundingMode;
import javax.persistence.EntityNotFoundException;
import java.io.UnsupportedEncodingException;
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
    private final VNPayService vnpayService;
    private final UserBalanceService userBalanceService;
    @Autowired
    public OrderService(
            OrderRepository orderRepository,
            ProductService productService,
            CouponService couponService,
            NotificationService notificationService, VNPayService vnPayService, UserBalanceService userBalanceService
    ) {
        this.orderRepository = orderRepository;
        this.productService = productService;
        this.couponService = couponService;
        this.notificationService = notificationService;
        this.vnpayService = vnPayService;
        this.userBalanceService = userBalanceService;
    }
    
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Order not found with id: " + id));
    }
    
    public List<Order> getUserOrders(User user) {
        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);

        for (Order order : orders) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getProduct() == null || item.getProduct().getId() == null) {
                    throw new RuntimeException("OrderItem is missing a valid productId: " + item);
                }
            }
        }

        return orders;
    }

    @Retryable(
            value = {org.springframework.dao.CannotAcquireLockException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000)
    )
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public Order createOrder(User user, OrderRequest orderRequest) throws UnsupportedEncodingException {
        // Create new order
        Order order = new Order();
        order.setUser(user);
        order.setStatus(Order.OrderStatus.PENDING); // Initially set as PENDING
        order.setShippingAddress(orderRequest.getShippingAddress());
        order.setPaymentMethod(orderRequest.getPaymentMethod());
        order.setPhoneNumber(orderRequest.getPhoneNumber());
        order.setRecipientName(orderRequest.getRecipientName());

        // Calculate total and add items
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        // Kiểm tra null trước khi truy cập items
        if (orderRequest.getItems() == null) {
            throw new IllegalArgumentException("Order items cannot be null. Please provide at least one item.");
        }

        for (OrderItemRequest itemRequest : orderRequest.getItems()) {
            Product product = productService.getProductByIdWithLock(itemRequest.getProductId());

            // Check if there's enough stock
            if (product.getStock() < itemRequest.getQuantity()) {
                throw new RuntimeException("Số lượng vượt quá giới hạn: " + product.getName());
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
                // Validate coupon - use the appropriate method from your CouponService
                Coupon coupon = couponService.verifyCoupon(
                    orderRequest.getCouponCode(),
                    user,
                    order.getTotalAmount().doubleValue()
                );

                if (coupon != null) {
                    // Apply discount
                    BigDecimal discountAmount;
                    if ("PERCENTAGE".equals(coupon.getDiscountType())) {
                        // Calculate percentage discount using BigDecimal operations
                        BigDecimal hundred = new BigDecimal("100");
                        BigDecimal percentage = coupon.getDiscountValue().divide(hundred, 6, BigDecimal.ROUND_HALF_UP);
                        discountAmount = order.getTotalAmount().multiply(percentage);
                    } else {
                        // Fixed amount discount - already a BigDecimal, no conversion needed
                        discountAmount = coupon.getDiscountValue();
                    }

                    // Make sure discount doesn't exceed total
                    if (discountAmount.compareTo(order.getTotalAmount()) > 0) {
                        discountAmount = order.getTotalAmount();
                    }

                    order.setCoupon(coupon);
                    order.setDiscountAmount(discountAmount);
                    order.calculateTotal(); // Recalculate total with discount
                    
                    // Không đánh dấu phiếu giảm giá ở đây - chỉ khi hoàn thành thanh toán
                    // Phiếu giảm giá sẽ được đánh dấu đã sử dụng trong createOrder
                }
            } catch (Exception e) {
                // If coupon validation fails, continue without applying coupon
                System.out.println("Coupon validation failed: " + e.getMessage());
            }
        }

        if (orderRequest.getTotal() != null) {
            // Use the client-provided total that includes the discount
            order.setTotalAmount(BigDecimal.valueOf(orderRequest.getTotal()).divide(new BigDecimal("1000"), 0, RoundingMode.HALF_UP)  // Chia 1000 và làm tròn số nguyên
                    .multiply(new BigDecimal("1000")));
        } else {
            // If no client total is provided, calculate the total with discount
            order.calculateTotal();
        }
        if ("account_balance".equals(orderRequest.getPaymentMethod())) {
            // Check if user has sufficient balance
            if (!userBalanceService.hasSufficientBalance(user, order.getTotalAmount())) {
                throw new RuntimeException("Insufficient account balance to complete payment");
            }

            // Process payment using user's balance
            try {
                userBalanceService.processOrderPayment(user, order.getTotalAmount(), order.getId());
                order.setPaymentStatus("PAID");
            } catch (Exception e) {
                throw new RuntimeException("Failed to process payment: " + e.getMessage());
            }
        } else if ("credit".equals(orderRequest.getPaymentMethod())) {
            // Para pagamento com cartão de crédito, definir status como PAID imediatamente
            order.setPaymentStatus("PAID");
        } else {
            // For other payment methods like COD, set status as PROCESSING
            order.setPaymentStatus("PROCESSING");
        }
        // Save the order initially
        Order savedOrder = orderRepository.save(order);

        // Đánh dấu phiếu giảm giá đã sử dụng nếu đơn hàng đã được tạo thành công
        if (orderRequest.getCouponCode() != null && !orderRequest.getCouponCode().isEmpty()) {
            try {
                couponService.useCoupon(orderRequest.getCouponCode());
            } catch (Exception e) {
                // Log lỗi nhưng không ảnh hưởng đến việc tạo đơn hàng
                System.err.println("Error marking coupon as used: " + e.getMessage());
            }
        }

        // Update the status to READY_TO_SHIP after successful order creation
        savedOrder.setStatus(Order.OrderStatus.READY_TO_SHIP);
        savedOrder = orderRepository.save(savedOrder);

        // Create notification for order success
        String title = "Đặt hàng thành công";
        String message = String.format("Đơn hàng #%d của bạn đã được xác nhận. Tổng tiền: %.2f VND. Cảm ơn bạn đã mua sắm!",
                savedOrder.getId(), savedOrder.getTotalAmount().doubleValue());

        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", savedOrder.getId());
        additionalData.put("totalAmount", savedOrder.getTotalAmount().doubleValue());
        additionalData.put("status", Order.OrderStatus.READY_TO_SHIP.name());

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
    public BigDecimal GetAmount(User user,OrderRequest orderRequest) {

        Order order = new Order();
        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        // Kiểm tra null trước khi truy cập items
        if (orderRequest.getItems() == null) {
            throw new IllegalArgumentException("Order items cannot be null. Please provide at least one item.");
        }

        for (OrderItemRequest itemRequest : orderRequest.getItems()) {
            Product product = productService.getProductById(itemRequest.getProductId());

            // Check if there's enough stock
            if (product.getStock() < itemRequest.getQuantity()) {
                throw new RuntimeException("Số lượng vượt quá giới hạn: " + product.getName());
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
                // Validate coupon - use the appropriate method from your CouponService
                Coupon coupon = couponService.verifyCoupon(
                        orderRequest.getCouponCode(),
                        user,
                        order.getTotalAmount().doubleValue()
                );

                if (coupon != null) {
                    // Apply discount
                    BigDecimal discountAmount;
                    if ("PERCENTAGE".equals(coupon.getDiscountType())) {
                        // Calculate percentage discount using BigDecimal operations
                        BigDecimal hundred = new BigDecimal("100");
                        BigDecimal percentage = coupon.getDiscountValue().divide(hundred, 6, BigDecimal.ROUND_HALF_UP);
                        discountAmount = order.getTotalAmount().multiply(percentage);
                    } else {
                        // Fixed amount discount - already a BigDecimal, no conversion needed
                        discountAmount = coupon.getDiscountValue();
                    }

                    // Make sure discount doesn't exceed total
                    if (discountAmount.compareTo(order.getTotalAmount()) > 0) {
                        discountAmount = order.getTotalAmount();
                    }

                    order.setCoupon(coupon);
                    order.setDiscountAmount(discountAmount);
                    order.calculateTotal(); // Recalculate total with discount
                }
            } catch (Exception e) {
                // If coupon validation fails, continue without applying coupon
                System.out.println("Coupon validation failed: " + e.getMessage());
            }
        }
        BigDecimal finalAmount;
        if (orderRequest.getTotal() != null) {
            // Use the client-provided total that includes the discount
            finalAmount= BigDecimal.valueOf(orderRequest.getTotal());
        } else {
            // If no client total is provided, calculate the total with discount
            finalAmount=order.calculateTotal();
        }
        BigDecimal rounded = finalAmount
                .divide(new BigDecimal("1000"), 0, RoundingMode.HALF_UP)  // Chia 1000 và làm tròn số nguyên
                .multiply(new BigDecimal("1000"));
        return rounded;
    }

    @Transactional
    public Order cancelOrder(Long orderId, User user) {
        Order order = getOrderById(orderId);
        
        // Check if this is the user's order
        if (!order.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only cancel your own orders");
        }
        
        // Check if order is in a state that can be cancelled
        if (order.getStatus() != Order.OrderStatus.PENDING && order.getStatus() != Order.OrderStatus.PROCESSING) {
            throw new RuntimeException("Cannot cancel order with status: " + order.getStatus());
        }
        
        // If payment was made with account balance, process refund
//        if ("account_balance".equals(order.getPaymentMethod()) && "PAID".equals(order.getPaymentStatus())) {
//            userBalanceService.refundOrderPayment(user, order.getTotalAmount(), orderId);
//        }
        
        // Return items to stock
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            product.setStock(product.getStock() + item.getQuantity());
            productService.updateProduct(product.getId(), product);
        }
        
        // Update order status
        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        order.setPaymentStatus("CANCELLED");
        
        Order savedOrder = orderRepository.save(order);
        
        // Create notification for order cancellation
        String title = "Đơn hàng đã bị hủy";
        String message = String.format("Đơn hàng #%d của bạn đã bị hủy.", savedOrder.getId());
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", savedOrder.getId());
        
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
    public Order updateOrderStatus(Long orderId, Order.OrderStatus newStatus) {
        Order order = getOrderById(orderId);
        order.setStatus(newStatus);
        
        Order savedOrder = orderRepository.save(order);
        
        // Create notification for status update
        String title = "Cập nhật trạng thái đơn hàng";
        String message = String.format("Đơn hàng #%d của bạn đã được cập nhật trạng thái thành: %s", 
                savedOrder.getId(), newStatus.toString());
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", savedOrder.getId());
        additionalData.put("status", newStatus.toString());
        
        notificationService.createNotificationForUser(
            savedOrder.getUser(), 
            title, 
            message, 
            "ORDER_STATUS_CHANGE", 
            additionalData
        );
        
        return savedOrder;
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
    
    @Transactional
    public Order refundOrder(Long orderId) {
        Order order = getOrderById(orderId);
        
        // Chỉ hoàn tiền cho đơn hàng đã bị hủy
        if (order.getStatus() != Order.OrderStatus.CANCELLED) {
            throw new RuntimeException("Chỉ có thể hoàn tiền cho đơn hàng đã bị hủy");
        }
        
        // Nếu đơn hàng đã được hoàn tiền trước đó, không hoàn tiền lại
        if ("REFUNDED".equals(order.getPaymentStatus())) {
            throw new RuntimeException("Đơn hàng này đã được hoàn tiền trước đó");
        }
        
//         Hoàn tiền dựa trên phương thức thanh toán
        if ("account_balance".equals(order.getPaymentMethod()) || "credit".equals(order.getPaymentMethod())) {
            // Hoàn tiền vào tài khoản người dùng
            userBalanceService.refundOrderPayment(order.getUser(), order.getTotalAmount(), orderId);
            order.setPaymentStatus("REFUNDED");
        } else if ("cod".equals(order.getPaymentMethod())) {
            // Đối với COD, chỉ cần đánh dấu là đã hủy vì khách hàng chưa thanh toán
            order.setPaymentStatus("CANCELLED");
        }

        order.setUpdatedAt(LocalDateTime.now());
        Order savedOrder = orderRepository.save(order);
        
        // Tạo thông báo hoàn tiền
        String title = "Hoàn tiền thành công";
        String message = String.format("Đơn hàng #%d đã được hoàn tiền thành công. Số tiền %s đã được hoàn vào tài khoản của bạn.", 
                savedOrder.getId(), savedOrder.getTotalAmount().toString());
        
        Map<String, Object> additionalData = new HashMap<>();
        additionalData.put("orderId", savedOrder.getId());
        additionalData.put("amount", savedOrder.getTotalAmount().doubleValue());
        additionalData.put("type", "REFUND");
        
        notificationService.createNotificationForUser(
            order.getUser(), 
            title, 
            message, 
            "ORDER_PAYMENT", 
            additionalData
        );
        
        return savedOrder;
    }
    
    /**
     * Get orders assigned to a specific shipper
     */
    public List<Order> getOrdersByShipperId(Long shipperId) {
        return orderRepository.findByShipperId(shipperId);
    }
    
    /**
     * Get orders for a shipper filtered by status
     */
    public List<Order> getOrdersByShipperAndStatus(Long shipperId, Order.OrderStatus status) {
        return orderRepository.findByShipperIdAndStatus(shipperId, status);
    }
    
    /**
     * Get orders that are ready for shipment (not assigned to any shipper)
     */
    public List<Order> getOrdersReadyForShipment() {
        return orderRepository.findExpandedOrdersReadyToShip();
    }
    
    /**
     * Assign an order to a shipper
     */
    @Transactional
    public Order assignOrderToShipper(Long orderId, Long shipperId) {
        Order order = getOrderById(orderId);
        
        // Check if order is in a state that can be assigned to a shipper
        if (order.getStatus() != Order.OrderStatus.PROCESSING) {
            throw new RuntimeException("Only orders with status PROCESSING can be assigned to shippers");
        }
        
        // Check if order is already assigned to another shipper
        if (order.getShipperId() != null && order.getShipperId() != 0 && !order.getShipperId().equals(shipperId)) {
            throw new RuntimeException("Order already assigned to another shipper");
        }
        
        // Assign shipper
        order.assignShipper(shipperId);
        
        // Update status to IN_TRANSIT
        order.updateStatus(Order.OrderStatus.IN_TRANSIT);
        
        // Save and return the updated order
        return orderRepository.save(order);
    }
}