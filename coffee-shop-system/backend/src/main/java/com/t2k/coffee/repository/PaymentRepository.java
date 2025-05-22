package com.t2k.coffee.repository;

import com.t2k.coffee.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {
    Payment findByOrderId(Integer orderId);
    List<Payment> findByPaymentMethod(String paymentMethod);
    List<Payment> findByPaymentStatus(String paymentStatus);
    List<Payment> findByCreateAtBetween(LocalDateTime startDate, LocalDateTime endDate);
} 