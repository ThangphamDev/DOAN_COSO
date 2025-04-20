package com.cafeapp.model;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "account")
public class Account {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Account")
    private Integer id;
    
    @Column(name = "Username", nullable = false, unique = true)
    private String username;
    
    @Column(name = "Password", nullable = false)
    private String password;
    
    @Column(name = "Full_Name")
    private String fullName;
    
    @Column(name = "Email", unique = true)
    private String email;
    
    @Column(name = "Phone")
    private String phone;
    
    @Column(name = "Role", nullable = false)
    private String role;
    
    @Column(name = "Is_Active")
    private Boolean isActive = true;
    
    @OneToMany(mappedBy = "account")
    private List<Order> orders;
    
    // Constructors
    public Account() {
    }
    
    public Account(String username, String password, String role) {
        this.username = username;
        this.password = password;
        this.role = role;
    }
    
    // Getters and Setters
    public Integer getId() {
        return id;
    }
    
    public void setId(Integer id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getRole() {
        return role;
    }
    
    public void setRole(String role) {
        this.role = role;
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
} 