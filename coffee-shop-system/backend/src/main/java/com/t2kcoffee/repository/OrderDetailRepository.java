package com.t2kcoffee.repository;

import com.t2kcoffee.model.OrderDetail;
import com.t2kcoffee.model.OrderDetailId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderDetailRepository extends JpaRepository<OrderDetail, OrderDetailId> {
    // Các phương thức truy vấn tùy chỉnh có thể được thêm vào đây
} 