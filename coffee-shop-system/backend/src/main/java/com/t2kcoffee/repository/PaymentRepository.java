package com.t2kcoffee.repository;

import com.t2kcoffee.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    List<Payment> findByOrder_IdOrder(Integer orderId);
    
    List<Payment> findByPaymentStatus(String status);
    
    List<Payment> findByPaymentMethod(String method);
} 