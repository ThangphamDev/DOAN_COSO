package com.t2kcoffee.repository;

import com.t2kcoffee.model.OrderVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderVariantRepository extends JpaRepository<OrderVariant, Integer> {
    
    /**
     * Tìm tất cả biến thể theo ID đơn hàng
     */
    @Query("SELECT ov FROM OrderVariant ov WHERE ov.orderDetail.id.idOrder = :orderId")
    List<OrderVariant> findByOrderDetailIdOrder(@Param("orderId") Integer orderId);
    
    /**
     * Tìm biến thể theo ID đơn hàng và ID sản phẩm
     */
    @Query("SELECT ov FROM OrderVariant ov WHERE ov.orderDetail.id.idOrder = :orderId AND ov.orderDetail.id.idProduct = :productId")
    Optional<OrderVariant> findByOrderDetailIdOrderAndOrderDetailIdProduct(
            @Param("orderId") Integer orderId, 
            @Param("productId") Integer productId);
    
    /**
     * Đếm số biến thể theo ID đơn hàng
     */
    @Query("SELECT COUNT(ov) FROM OrderVariant ov WHERE ov.orderDetail.id.idOrder = :orderId")
    long countByOrderDetailIdOrder(@Param("orderId") Integer orderId);
} 