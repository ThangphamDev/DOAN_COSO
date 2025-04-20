package com.cafeapp.model;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "`table`") // Backticks because "table" is a reserved word in SQL
public class Table {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Table")
    private Integer id;
    
    @Column(name = "Table_Number", nullable = false)
    private Integer tableNumber;
    
    @Column(name = "Capacity")
    private Integer capacity;
    
    @Column(name = "Is_Available")
    private Boolean isAvailable = true;
    
    @OneToMany(mappedBy = "table")
    private List<Order> orders;
    
    // Constructors
    public Table() {
    }
    
    public Table(Integer tableNumber, Integer capacity) {
        this.tableNumber = tableNumber;
        this.capacity = capacity;
    }
    
    // Getters and Setters
    public Integer getId() {
        return id;
    }
    
    public void setId(Integer id) {
        this.id = id;
    }
    
    public Integer getTableNumber() {
        return tableNumber;
    }
    
    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }
    
    public Integer getCapacity() {
        return capacity;
    }
    
    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
    
    public Boolean getIsAvailable() {
        return isAvailable;
    }
    
    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }
    
    public List<Order> getOrders() {
        return orders;
    }
    
    public void setOrders(List<Order> orders) {
        this.orders = orders;
    }
} 