package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.List;

@Data
@Entity
@Table(name = "cafeorder")
public class CafeOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Order")
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "ID_Table")
    private CafeTable table;

    private Integer quantity;
    
    @Column(name = "order_time")
    private LocalDateTime orderTime;
    
    @Column(name = "total_amount")
    private BigDecimal totalAmount;
    
    private String note;
    
    @ManyToOne
    @JoinColumn(name = "ID_Account")
    private Account account;
    
    @ManyToOne
    @JoinColumn(name = "ID_Promotion")
    private Promotion promotion;
    
    private String status;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderDetail> orderDetails;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    private Payment payment;
} 