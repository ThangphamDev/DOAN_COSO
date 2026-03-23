package com.t2kcoffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Data
@Table(name = "category")
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Category")
    private Integer idCategory;

    @Column(name = "Category_Name")
    private String categoryName;
    
    @Column(name = "Description")
    private String description;
    
    @JsonManagedReference
    @JsonIgnoreProperties("category")
    @OneToMany(mappedBy = "category")
    private List<Product> products;
} 