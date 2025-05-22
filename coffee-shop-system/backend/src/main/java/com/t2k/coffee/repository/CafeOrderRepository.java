package com.t2k.coffee.repository;

import com.t2k.coffee.entity.CafeOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface CafeOrderRepository extends JpaRepository<CafeOrder, Integer> {
    List<CafeOrder> findByAccountId(Integer accountId);
    List<CafeOrder> findByStatus(String status);
    List<CafeOrder> findByOrderTimeBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<CafeOrder> findByTableId(Integer tableId);
} 