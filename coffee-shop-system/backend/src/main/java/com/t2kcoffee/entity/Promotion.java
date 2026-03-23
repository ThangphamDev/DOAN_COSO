package com.t2kcoffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;

@Entity
@Data
@Table(name = "promotion")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Promotion")
    private Integer idPromotion;

    @Column(name = "Name_Promotion")
    private String namePromotion;
    
    @Column(name = "Code")
    private String code;
    
    @Column(name = "Start_Date")
    @Temporal(TemporalType.DATE)
    private Date startDate;
    
    @Column(name = "End_Date")
    @Temporal(TemporalType.DATE)
    private Date endDate;
    
    @Column(name = "Is_Active")
    private Boolean isActive = true;
    
    @Column(name = "Discount_Type")
    private String discountType; // "PERCENT" hoặc "FIXED"
    
    @Column(name = "Discount_Value")
    private BigDecimal discountValue;
    
    @Column(name = "Minimum_Order_Amount")
    private BigDecimal minimumOrderAmount;
    
    @Column(name = "Maximum_Discount")
    private BigDecimal maximumDiscount;
    
    @Column(name = "Description")
    private String description;
    
    @JsonIgnore
    @OneToMany(mappedBy = "promotion")
    private List<CafeOrder> orders;
} 