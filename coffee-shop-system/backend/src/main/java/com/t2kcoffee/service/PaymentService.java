package com.t2kcoffee.service;

import com.t2kcoffee.entity.Payment;
import com.t2kcoffee.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Autowired
    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(Integer id) {
        return paymentRepository.findById(id);
    }

    public List<Payment> getPaymentsByOrderId(Integer orderId) {
        return paymentRepository.findByOrder_IdOrder(orderId);
    }

    public List<Payment> getPaymentsByStatus(String status) {
        return paymentRepository.findByPaymentStatus(status);
    }

    public List<Payment> getPaymentsByMethod(String method) {
        return paymentRepository.findByPaymentMethod(method);
    }

    @Transactional
    public Payment createPayment(Payment payment) {
        // Set creation time to current time if not set
        if (payment.getCreateAt() == null) {
            payment.setCreateAt(new Date());
        }
        
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment updatePaymentStatus(Integer id, String status) {
        Optional<Payment> paymentOpt = paymentRepository.findById(id);
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            payment.setPaymentStatus(status);
            return paymentRepository.save(payment);
        }
        return null;
    }

    @Transactional
    public void deletePayment(Integer id) {
        paymentRepository.deleteById(id);
    }
} 