package com.cafeapp.repository;

import com.cafeapp.model.Account;
import com.cafeapp.model.Order;
import com.cafeapp.model.Table;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    
    List<Order> findByAccount(Account account);
    
    List<Order> findByTable(Table table);
    
    List<Order> findByStatus(String status);
    
    List<Order> findByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT o FROM Order o WHERE o.table.id = ?1 AND o.status != 'Completed' AND o.status != 'Cancelled'")
    List<Order> findActiveOrdersByTableId(Integer tableId);
    
    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderDate BETWEEN ?1 AND ?2")
    Long countOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'Completed' AND o.orderDate BETWEEN ?1 AND ?2")
    Double getSumTotalAmountByDateRange(LocalDateTime startDate, LocalDateTime endDate);
} 