package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "payment")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Payment")
    private Integer id;

    @OneToOne
    @JoinColumn(name = "ID_Order")
    private CafeOrder order;

    @Column(name = "create_at")
    private LocalDateTime createAt;
    
    @Column(name = "payment_method")
    private String paymentMethod;
    
    @Column(name = "payment_status")
    private String paymentStatus;
} 