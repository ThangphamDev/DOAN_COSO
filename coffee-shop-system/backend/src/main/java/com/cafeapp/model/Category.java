package com.cafeapp.model;

import javax.persistence.*;
import java.util.List;

@Entity
@Table(name = "category")
public class Category {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Category")
    private Integer id;
    
    @Column(name = "Category_Name", nullable = false)
    private String name;
    
    @Column(name = "Description")
    private String description;
    
    @OneToMany(mappedBy = "category")
    private List<Product> products;
    
    // Constructors
    public Category() {
    }
    
    public Category(String name) {
        this.name = name;
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
    
    public List<Product> getProducts() {
        return products;
    }
    
    public void setProducts(List<Product> products) {
        this.products = products;
    }
} 