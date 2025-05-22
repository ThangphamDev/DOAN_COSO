package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "promotion")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Promotion")
    private Integer id;

    @Column(name = "Name_Promotion")
    private String name;
    
    private String code;
    
    @Column(name = "Start_Date")
    private LocalDate startDate;
    
    @Column(name = "End_Date")
    private LocalDate endDate;
    
    @Column(name = "Is_Active")
    private Boolean isActive;
    
    @Column(name = "discount_type")
    private String discountType;
    
    @Column(name = "discount_value")
    private BigDecimal discountValue;
    
    @Column(name = "minimum_order_amount")
    private BigDecimal minimumOrderAmount;
    
    @Column(name = "maximum_discount")
    private BigDecimal maximumDiscount;
    
    private String description;
} 