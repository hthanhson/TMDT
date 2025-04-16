package com.example.tmdt.repository;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.Order.OrderStatus;
import com.example.tmdt.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    // Tìm tất cả đơn hàng của một người dùng
    List<Order> findByUserId(Long userId);
    
    // Tìm đơn hàng theo người dùng và phân trang
    Page<Order> findByUserId(Long userId, Pageable pageable);
    
    // Tìm đơn hàng theo User entity
    List<Order> findByUser(User user);
    
    // Tìm đơn hàng theo User entity sắp xếp theo createdAt giảm dần
    List<Order> findByUserOrderByCreatedAtDesc(User user);
    
    // Tìm đơn hàng theo trạng thái
    List<Order> findByStatus(OrderStatus status);
    
    // Tìm đơn hàng theo trạng thái và phân trang
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    
    // Tìm đơn hàng theo trạng thái và phân trang cho admin
    @Query("SELECT o FROM Order o WHERE o.status = :status")
    Page<Order> findByStatusForAdmin(@Param("status") OrderStatus status, Pageable pageable);
    
    // Tìm đơn hàng đã được gán cho shipper cụ thể
    List<Order> findByShipperId(Long shipperId);
    
    // Tìm đơn hàng đã được gán cho shipper cụ thể và phân trang
    Page<Order> findByShipperId(Long shipperId, Pageable pageable);
    
    // Tìm đơn hàng đã được gán cho shipper cụ thể, với trạng thái cụ thể và phân trang
    Page<Order> findByShipperIdAndStatus(Long shipperId, OrderStatus status, Pageable pageable);
    
    // Tìm đơn hàng đã được gán cho shipper cụ thể, với trạng thái cụ thể
    List<Order> findByShipperIdAndStatus(Long shipperId, OrderStatus status);
    
    // Tìm đơn hàng sẵn sàng cho shipper (đã được admin xác nhận, chưa được gán cho shipper)
    @Query("SELECT o FROM Order o WHERE o.status = 'PROCESSING' AND (o.shipperId IS NULL OR o.shipperId = 0)")
    Page<Order> findOrdersReadyToShip(Pageable pageable);
    
    // Tìm đơn hàng sẵn sàng cho shipper (đã được admin xác nhận, chưa được gán cho shipper)
    @Query("SELECT o FROM Order o WHERE o.status = 'PROCESSING' AND (o.shipperId IS NULL OR o.shipperId = 0)")
    List<Order> findOrdersReadyToShip();
    
    // Tìm đơn hàng trong khoảng thời gian
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    // Thống kê đơn hàng theo trạng thái
    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countOrdersByStatus();
    
    // Tìm tất cả đơn hàng có trạng thái cần giao hàng (cho shipper)
    @Query("SELECT o FROM Order o WHERE o.status IN ('READY_TO_SHIP', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED_AT_STATION', 'OUT_FOR_DELIVERY')")
    List<Order> findAllActiveShippingOrders();
    
    // Tìm đơn hàng sẵn sàng cho shipper (đã được admin xác nhận hoặc đánh dấu sẵn sàng giao hàng, chưa được gán cho shipper)
    @Query("SELECT o FROM Order o WHERE (o.status = 'PROCESSING' OR o.status = 'CONFIRMED' OR o.status = 'READY_TO_SHIP') AND (o.shipperId IS NULL OR o.shipperId = 0)")
    Page<Order> findExpandedOrdersReadyToShip(Pageable pageable);
    
    // Tìm đơn hàng sẵn sàng cho shipper (đã được admin xác nhận hoặc đánh dấu sẵn sàng giao hàng, chưa được gán cho shipper)
    @Query("SELECT o FROM Order o WHERE (o.status = 'PROCESSING' OR o.status = 'CONFIRMED' OR o.status = 'READY_TO_SHIP') AND (o.shipperId IS NULL OR o.shipperId = 0)")
    List<Order> findExpandedOrdersReadyToShip();
} 