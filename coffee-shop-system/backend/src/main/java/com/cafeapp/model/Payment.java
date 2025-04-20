package com.cafeapp.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Payment")
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "ID_Order")
    private Order order;
    
    @Column(name = "Payment_Date")
    private LocalDateTime paymentDate = LocalDateTime.now();
    
    @Column(name = "Payment_Method")
    private String paymentMethod;
    
    @Column(name = "Amount", nullable = false)
    private BigDecimal amount;
    
    @Column(name = "Status")
    private String status = "Pending";
    
    // Constructors
    public Payment() {
    }
    
    public Payment(Order order, String paymentMethod, BigDecimal amount) {
        this.order = order;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
    }
    
    // Getters and Setters
    public Integer getId() {
        return id;
    }
    
    public void setId(Integer id) {
        this.id = id;
    }
    
    public Order getOrder() {
        return order;
    }
    
    public void setOrder(Order order) {
        this.order = order;
    }
    
    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }
    
    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }
    
    public String getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public BigDecimal getAmount() {
        return amount;
    }
    
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
} 