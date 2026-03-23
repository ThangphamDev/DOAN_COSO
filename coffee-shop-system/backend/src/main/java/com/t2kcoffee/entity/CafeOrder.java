package com.t2kcoffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.util.List;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Table(name = "cafeorder")
public class CafeOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Order")
    private Integer idOrder;

    @ManyToOne
    @JoinColumn(name = "ID_Table")
    private CafeTable table;
    
    @Column(name = "Quantity")
    private Integer quantity;
    
    @Column(name = "Order_Time")
    @Temporal(TemporalType.TIMESTAMP)
    private Date orderTime;
    
    @Column(name = "Total_Amount")
    private BigDecimal totalAmount;
    
    @Column(name = "Note")
    private String note;
    
    @Column(name = "Status") 
    private String status = "processing"; 
    
    @ManyToOne
    @JoinColumn(name = "ID_Account")
    @JsonIgnore
    private Account account;
    
    @ManyToOne
    @JoinColumn(name = "ID_Promotion")
    @JsonIgnore
    private Promotion promotion;
    
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    private List<OrderDetail> orderDetails;
    
    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL)
    @JsonIgnore
    private Payment payment;
} 