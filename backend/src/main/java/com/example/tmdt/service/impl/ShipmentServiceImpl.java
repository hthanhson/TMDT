package com.example.tmdt.service.impl;

import com.example.tmdt.exception.ResourceNotFoundException;
import com.example.tmdt.exception.OperationNotAllowedException;
import com.example.tmdt.model.Order;
import com.example.tmdt.model.OrderStatus;
import com.example.tmdt.model.ShipmentTracking;
import com.example.tmdt.payload.request.StatusUpdateRequest;
import com.example.tmdt.repository.OrderRepository;
import com.example.tmdt.repository.ShipmentTrackingRepository;
import com.example.tmdt.service.NotificationService;
import com.example.tmdt.service.ShipmentService;
import com.example.tmdt.util.OrderStatusConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ShipmentServiceImpl implements ShipmentService {

    private static final Logger log = LoggerFactory.getLogger(ShipmentServiceImpl.class);

    @Autowired
    private OrderRepository orderRepository;
    
    @Autowired
    private ShipmentTrackingRepository shipmentTrackingRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Override
    public List<ShipmentTracking> getShipmentTrackingByOrderId(Long orderId) {
        return shipmentTrackingRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }

    @Override
    public List<ShipmentTracking> getShipmentTrackingByShipperId(Long shipperId) {
        return shipmentTrackingRepository.findByCreatedByOrderByCreatedAtDesc(shipperId);
    }

    @Override
    @Transactional
    public ShipmentTracking updateOrderStatus(Long orderId, StatusUpdateRequest statusUpdateRequest, Long shipperId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        
        // Kiểm tra xem shipper có được gán cho đơn hàng này không
        if (!order.getShipperId().equals(shipperId)) {
            throw new IllegalStateException("Shipper is not assigned to this order");
        }
        
        // Convert StatusUpdateRequest.status (Order.OrderStatus) to OrderStatus
        OrderStatus requestStatus = convertToExternalStatus(statusUpdateRequest.getStatus());
        
        // Lấy trạng thái hiện tại
        OrderStatus currentStatus = OrderStatusConverter.toOrderStatus(order.getStatus());
        
        // Kiểm tra trạng thái mới có hợp lệ không
        validateStatusTransition(currentStatus, requestStatus);
        
        // Cập nhật trạng thái đơn hàng
        Order.OrderStatus internalNewStatus = statusUpdateRequest.getStatus();
        order.updateStatus(internalNewStatus);
        
        // Lưu lịch sử tracking
        ShipmentTracking tracking = new ShipmentTracking();
        tracking.setOrder(order);
        tracking.setStatus(internalNewStatus);
        tracking.setLocation(statusUpdateRequest.getLocation());
        tracking.setNotes(statusUpdateRequest.getNotes());
        tracking.setCreatedBy(shipperId);
        tracking.setLatitude(statusUpdateRequest.getLatitude());
        tracking.setLongitude(statusUpdateRequest.getLongitude());
        tracking.setCreatedAt(LocalDateTime.now());
        shipmentTrackingRepository.save(tracking);
        
        // Lưu đơn hàng
        Order savedOrder = orderRepository.save(order);
        
        // Gửi thông báo cho người dùng
        String statusMessage = "Đơn hàng #" + orderId + " của bạn hiện " + getDisplayName(requestStatus);
        if (requestStatus == OrderStatus.DELIVERED) {
            statusMessage = "Đơn hàng #" + orderId + " đã được giao thành công. Cảm ơn bạn đã mua sắm!";
        }
        
        notificationService.sendOrderStatusNotification(
                order.getUserId(),
                statusMessage,
                "Cập nhật trạng thái đơn hàng"
        );
        
        return tracking;
    }
    
    @Override
    public Page<Order> getShipperOrders(Long shipperId, Pageable pageable) {
        return orderRepository.findByShipperId(shipperId, pageable);
    }
    
    @Override
    public Page<Order> getShipperOrdersByStatus(Long shipperId, OrderStatus status, Pageable pageable) {
        // Convert OrderStatus to Order.OrderStatus for the repository
        Order.OrderStatus orderStatus = convertToInternalStatus(status);
        return orderRepository.findByShipperIdAndStatus(shipperId, orderStatus, pageable);
    }
    
    @Override
    public Page<Order> getOrdersReadyToShip(Pageable pageable) {
        return orderRepository.findOrdersReadyToShip(pageable);
    }
    
    @Override
    public Page<Order> getExpandedOrdersReadyToShip(Pageable pageable) {
        return orderRepository.findExpandedOrdersReadyToShip(pageable);
    }
    
    @Override
    public Order acceptOrder(Long orderId, Long shipperId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            throw new ResourceNotFoundException("Order not found with id " + orderId);
        }
        
        Order order = orderOpt.get();
        
        // Check if order is already assigned to another shipper
        if (order.getShipperId() != null && order.getShipperId() != 0 && !order.getShipperId().equals(shipperId)) {
            throw new OperationNotAllowedException("This order is already assigned to another shipper");
        }
        
        // Check if order is in a valid state for assignment
        Order.OrderStatus currentStatus = order.getStatus();
        if (currentStatus != Order.OrderStatus.PROCESSING) {
            // Check if it's an expanded status that maps to PROCESSING
            OrderStatus externalStatus = convertToExternalStatus(currentStatus);
            if (externalStatus != OrderStatus.CONFIRMED && externalStatus != OrderStatus.READY_TO_SHIP && externalStatus != OrderStatus.PROCESSING) {
                throw new OperationNotAllowedException("Order cannot be accepted in " + currentStatus + " status");
            }
        }
        
        // Set the shipper ID
        order.setShipperId(shipperId);
        
        // Update the status to IN_TRANSIT
        order.updateStatus(Order.OrderStatus.IN_TRANSIT);
        
        // Save the order
        Order updatedOrder = orderRepository.save(order);
        
        // Create tracking record
        ShipmentTracking tracking = new ShipmentTracking(
            orderId, 
            OrderStatus.IN_TRANSIT, 
            "Warehouse",
            "Order picked up by shipper and in transit",
            shipperId
        );
        
        shipmentTrackingRepository.save(tracking);
        
        // Send notification to customer
        try {
            notificationService.sendOrderStatusNotification(
                    order.getUserId(),
                    "Đơn hàng #" + orderId + " của bạn đang được vận chuyển.",
                    "Cập nhật trạng thái đơn hàng"
            );
        } catch (Exception e) {
            // Log but don't fail the operation if notification sending fails
            // We could add a retry mechanism here
            log.error("Failed to send notification for order {}: {}", orderId, e.getMessage());
        }
        
        return updatedOrder;
    }
    
    @Override
    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus, String location, 
                                 String description, Long shipperId, Double latitude, Double longitude) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        
        // Kiểm tra xem shipper có được gán cho đơn hàng này không
        if (!order.getShipperId().equals(shipperId)) {
            throw new IllegalStateException("Shipper is not assigned to this order");
        }
        
        // Lấy trạng thái hiện tại
        OrderStatus currentStatus = OrderStatusConverter.toOrderStatus(order.getStatus());
        
        // Kiểm tra trạng thái mới có hợp lệ không
        validateStatusTransition(currentStatus, newStatus);
        
        // Cập nhật trạng thái đơn hàng
        Order.OrderStatus internalNewStatus = convertToInternalStatus(newStatus);
        order.updateStatus(internalNewStatus);
        
        // Lưu lịch sử tracking
        ShipmentTracking tracking = new ShipmentTracking();
        tracking.setOrder(order);
        tracking.setStatus(internalNewStatus);
        tracking.setLocation(location);
        tracking.setNotes(description);
        tracking.setCreatedBy(shipperId);
        tracking.setLatitude(latitude);
        tracking.setLongitude(longitude);
        tracking.setCreatedAt(LocalDateTime.now());
        shipmentTrackingRepository.save(tracking);
        
        // Lưu đơn hàng
        Order savedOrder = orderRepository.save(order);
        
        // Gửi thông báo cho người dùng
        String statusMessage = "Đơn hàng #" + orderId + " của bạn hiện " + getDisplayName(newStatus);
        if (newStatus == OrderStatus.DELIVERED) {
            statusMessage = "Đơn hàng #" + orderId + " đã được giao thành công. Cảm ơn bạn đã mua sắm!";
        }
        
        notificationService.sendOrderStatusNotification(
                order.getUserId(),
                statusMessage,
                "Cập nhật trạng thái đơn hàng"
        );
        
        return savedOrder;
    }
    
    @Override
    public List<ShipmentTracking> getOrderTrackingHistory(Long orderId) {
        return shipmentTrackingRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }
    
    // Helper methods to handle OrderStatus conversions
    private OrderStatus convertToExternalStatus(Order.OrderStatus internalStatus) {
        return OrderStatus.valueOf(internalStatus.name());
    }
    
    private Order.OrderStatus convertToInternalStatus(OrderStatus externalStatus) {
        return Order.OrderStatus.valueOf(externalStatus.name());
    }
    
    private String getDisplayName(OrderStatus status) {
        switch (status) {
            case PENDING: return "Chờ xác nhận";
            case CONFIRMED: return "Đã xác nhận";
            case PROCESSING: return "Đang xử lý";
            case READY_TO_SHIP: return "Sẵn sàng giao hàng";
            case PICKED_UP: return "Đã lấy hàng";
            case IN_TRANSIT: return "Đang vận chuyển";
            case ARRIVED_AT_STATION: return "Đến trạm trung chuyển";
            case OUT_FOR_DELIVERY: return "Đang giao hàng";
            case DELIVERED: return "Đã giao hàng";
            case COMPLETED: return "Hoàn tất";
            case CANCELLED: return "Đã hủy";
            case RETURNED: return "Hoàn trả";
            default: return status.name();
        }
    }
    
    /**
     * Kiểm tra tính hợp lệ của trạng thái mới
     */
    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        // Định nghĩa các trạng thái hợp lệ tiếp theo dựa vào trạng thái hiện tại
        switch (currentStatus) {
            case PROCESSING:
            case READY_TO_SHIP:
                if (newStatus != OrderStatus.IN_TRANSIT) {
                    throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            case PICKED_UP:
                if (newStatus != OrderStatus.IN_TRANSIT && newStatus != OrderStatus.ARRIVED_AT_STATION) {
                    throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            case IN_TRANSIT:
                if (newStatus != OrderStatus.ARRIVED_AT_STATION && newStatus != OrderStatus.OUT_FOR_DELIVERY) {
                    throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            case ARRIVED_AT_STATION:
                if (newStatus != OrderStatus.IN_TRANSIT && newStatus != OrderStatus.OUT_FOR_DELIVERY) {
                    throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            case OUT_FOR_DELIVERY:
                if (newStatus != OrderStatus.DELIVERED && newStatus != OrderStatus.RETURNED) {
                    throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            case DELIVERED:
                if (newStatus != OrderStatus.COMPLETED) {
                    throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + newStatus);
                }
                break;
            default:
                throw new IllegalStateException("Cannot update order with current status: " + currentStatus);
        }
    }
} 