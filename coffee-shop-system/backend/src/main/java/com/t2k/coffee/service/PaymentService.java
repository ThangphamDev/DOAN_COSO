package com.t2k.coffee.service;

import com.t2k.coffee.entity.Payment;
import com.t2k.coffee.entity.CafeOrder;
import com.t2k.coffee.repository.PaymentRepository;
import com.t2k.coffee.repository.CafeOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private CafeOrderRepository orderRepository;
    
    @Autowired
    private OrderService orderService;

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(Integer id) {
        return paymentRepository.findById(id);
    }

    public Payment getPaymentByOrderId(Integer orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    public List<Payment> getPaymentsByMethod(String paymentMethod) {
        return paymentRepository.findByPaymentMethod(paymentMethod);
    }

    public List<Payment> getPaymentsByStatus(String paymentStatus) {
        return paymentRepository.findByPaymentStatus(paymentStatus);
    }

    public List<Payment> getPaymentsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return paymentRepository.findByCreateAtBetween(startDate, endDate);
    }

    @Transactional
    public Payment createPayment(Payment payment) {
        // Set initial values
        payment.setCreateAt(LocalDateTime.now());
        payment.setPaymentStatus("pending");
        
        // Validate order exists
        CafeOrder order = orderRepository.findById(payment.getOrder().getId())
            .orElseThrow(() -> new RuntimeException("Order not found"));
        
        // Save payment
        Payment savedPayment = paymentRepository.save(payment);
        
        // Update order status
        orderService.updateOrderStatus(order.getId(), "completed");
        
        return savedPayment;
    }

    @Transactional
    public Payment updatePaymentStatus(Integer id, String status) {
        Payment payment = paymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Payment not found"));
        
        payment.setPaymentStatus(status);
        
        // If payment is completed, update order status
        if (status.equals("completed")) {
            orderService.updateOrderStatus(payment.getOrder().getId(), "completed");
        }
        
        return paymentRepository.save(payment);
    }

    public void deletePayment(Integer id) {
        paymentRepository.deleteById(id);
    }
} 