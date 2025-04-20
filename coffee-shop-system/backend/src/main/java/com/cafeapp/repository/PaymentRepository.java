package com.cafeapp.repository;

import com.cafeapp.model.Order;
import com.cafeapp.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    
    List<Payment> findByOrder(Order order);
    
    List<Payment> findByOrderId(Integer orderId);
    
    List<Payment> findByStatus(String status);
    
    List<Payment> findByPaymentMethod(String paymentMethod);
    
    List<Payment> findByPaymentDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'Completed' AND p.paymentDate BETWEEN ?1 AND ?2")
    Double getTotalRevenue(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT p.paymentMethod, COUNT(p) FROM Payment p WHERE p.status = 'Completed' GROUP BY p.paymentMethod")
    List<Object[]> countByPaymentMethod();
} 