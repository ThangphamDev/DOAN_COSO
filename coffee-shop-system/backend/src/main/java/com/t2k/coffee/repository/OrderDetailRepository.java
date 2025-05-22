package com.t2k.coffee.repository;

import com.t2k.coffee.entity.OrderDetail;
import com.t2k.coffee.entity.OrderDetailId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, OrderDetailId> {
    List<OrderDetail> findByOrderId(Integer orderId);
    List<OrderDetail> findByProductId(Integer productId);
} 