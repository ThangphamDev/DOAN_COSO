package com.cafeapp.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "promotion")
public class Promotion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Promotion")
    private Integer id;
    
    @Column(name = "Promotion_Name", nullable = false)
    private String name;
    
    @Column(name = "Description")
    private String description;
    
    @Column(name = "Discount_Rate")
    private BigDecimal discountRate;
    
    @Column(name = "Start_Date", nullable = false)
    private LocalDateTime startDate;
    
    @Column(name = "End_Date", nullable = false)
    private LocalDateTime endDate;
    
    @Column(name = "Is_Active")
    private Boolean isActive = true;
    
    @OneToMany(mappedBy = "promotion")
    private List<Order> orders;
    
    // Constructors
    public Promotion() {
    }
    
    public Promotion(String name, BigDecimal discountRate, LocalDateTime startDate, LocalDateTime endDate) {
        this.name = name;
        this.discountRate = discountRate;
        this.startDate = startDate;
        this.endDate = endDate;
    }
    
    // Getters and Setters
    public Integer getId() {
        return id;
    }
    
    public void setId(Integer id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public BigDecimal getDiscountRate() {
        return discountRate;
    }
    
    public void setDiscountRate(BigDecimal discountRate) {
        this.discountRate = discountRate;
    }
    
    public LocalDateTime getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }
    
    public LocalDateTime getEndDate() {
        return endDate;
    }
    
    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public List<Order> getOrders() {
        return orders;
    }
    
    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }
    
    // Helper methods
    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && (now.isAfter(startDate) || now.isEqual(startDate)) && now.isBefore(endDate);
    }
} 