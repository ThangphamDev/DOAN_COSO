package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "category")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Category")
    private Integer id;

    @Column(name = "category_name")
    private String categoryName;
    
    private String description;

    @OneToMany(mappedBy = "category")
    private List<Product> products;
} 