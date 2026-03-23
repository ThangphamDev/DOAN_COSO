package com.t2kcoffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Entity
@Data
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Payment")
    private Integer idPayment;

    @OneToOne
    @JoinColumn(name = "ID_Order")
    private CafeOrder order;
    
    @Column(name = "Create_At")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createAt;
    
    @Column(name = "Payment_Method")
    private String paymentMethod;
    
    @Column(name = "Payment_Status")
    private String paymentStatus;
} 