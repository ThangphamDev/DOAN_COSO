package com.t2kcoffee.repository;

import com.t2kcoffee.entity.CafeOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface CafeOrderRepository extends JpaRepository<CafeOrder, Integer> {
    List<CafeOrder> findByAccount_IdAccount(Integer accountId);
    
    List<CafeOrder> findByTable_IdTable(Integer tableId);
    
    @Query("SELECT o FROM CafeOrder o WHERE o.orderTime BETWEEN :startDate AND :endDate ORDER BY o.orderTime DESC")
    List<CafeOrder> findOrdersInDateRange(@Param("startDate") Date startDate, @Param("endDate") Date endDate);
    
    List<CafeOrder> findByStatus(String status);
    
    List<CafeOrder> findTop10ByOrderByOrderTimeDesc();

    List<CafeOrder> findByOrderTimeBetween(Date startDate, Date endDate);
} 
