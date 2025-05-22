package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "product")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Product")
    private Integer id;

    @Column(name = "product_name")
    private String productName;
    
    private Double price;
    private String description;
    private String image;
    
    @Column(name = "Is_Available")
    private Boolean isAvailable;

    @ManyToOne
    @JoinColumn(name = "ID_Category")
    private Category category;
} 