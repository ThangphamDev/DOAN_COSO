package com.cafeapp.repository;

import com.cafeapp.model.Order;
import com.cafeapp.model.OrderDetail;
import com.cafeapp.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, Integer> {
    
    List<OrderDetail> findByOrder(Order order);
    
    List<OrderDetail> findByProduct(Product product);
    
    @Query("SELECT od FROM OrderDetail od WHERE od.order.id = ?1")
    List<OrderDetail> findByOrderId(Integer orderId);
    
    @Query("SELECT od.product.id as productId, SUM(od.quantity) as totalQuantity " +
           "FROM OrderDetail od " +
           "JOIN od.order o " +
           "WHERE o.status = 'Completed' AND o.orderDate BETWEEN ?1 AND ?2 " +
           "GROUP BY od.product.id " +
           "ORDER BY totalQuantity DESC")
    List<Map<String, Object>> findTopSellingProducts(LocalDateTime startDate, LocalDateTime endDate);
} 