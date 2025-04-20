package com.cafeapp.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "`order`") // Backticks because "order" is a reserved word in SQL
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Order")
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "ID_Table")
    private Table table;
    
    @ManyToOne
    @JoinColumn(name = "ID_Account")
    private Account account;
    
    @ManyToOne
    @JoinColumn(name = "ID_Promotion")
    private Promotion promotion;
    
    @Column(name = "Order_Date")
    private LocalDateTime orderDate = LocalDateTime.now();
    
    @Column(name = "Total_Amount")
    private BigDecimal totalAmount;
    
    @Column(name = "Status")
    private String status = "Pending";
    
    @Column(name = "Note")
    private String note;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderDetail> orderDetails;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<Payment> payments;
    
    // Constructors
    public Order() {
    }
    
    public Order(Table table, Account account) {
        this.table = table;
        this.account = account;
    }
    
    // Getters and Setters
    public Integer getId() {
        return id;
    }
    
    public void setId(Integer id) {
        this.id = id;
    }
    
    public Table getTable() {
        return table;
    }
    
    public void setTable(Table table) {
        this.table = table;
    }
    
    public Account getAccount() {
        return account;
    }
    
    public void setAccount(Account account) {
        this.account = account;
    }
    
    public Promotion getPromotion() {
        return promotion;
    }
    
    public void setPromotion(Promotion promotion) {
        this.promotion = promotion;
    }
    
    public LocalDateTime getOrderDate() {
        return orderDate;
    }
    
    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }
    
    public BigDecimal getTotalAmount() {
        return totalAmount;
    }
    
    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public String getNote() {
        return note;
    }
    
    public void setNote(String note) {
        this.note = note;
    }
    
    public List<OrderDetail> getOrderDetails() {
        return orderDetails;
    }
    
    public void setOrderDetails(List<OrderDetail> orderDetails) {
        this.orderDetails = orderDetails;
    }
    
    public List<Payment> getPayments() {
        return payments;
    }
    
    public void setPayments(List<Payment> payments) {
        this.payments = payments;
    }
    
    // Helper method to calculate total
    public void calculateTotal() {
        if (orderDetails == null || orderDetails.isEmpty()) {
            this.totalAmount = BigDecimal.ZERO;
            return;
        }
        
        BigDecimal total = orderDetails.stream()
                .map(OrderDetail::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Apply promotion discount if available
        if (promotion != null && promotion.getDiscountRate() != null) {
            BigDecimal discountAmount = total.multiply(promotion.getDiscountRate()).divide(new BigDecimal("100"));
            total = total.subtract(discountAmount);
        }
        
        this.totalAmount = total;
    }
} 