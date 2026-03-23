package com.t2kcoffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;

@Entity
@Data
@Table(name = "product")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Product")
    private Integer idProduct;

    @Column(name = "Product_Name")
    private String productName;
    
    @Column(name = "Price")
    private Double price;
    
    @Column(name = "Description")
    private String description;

    @Column(name = "Image", length = 255)
    private String image;

    @Column(name = "Is_Available")
    private Boolean isAvailable = true;

    @JsonBackReference
    @JsonIgnoreProperties("products")
    @ManyToOne
    @JoinColumn(name = "ID_Category")
    private Category category;
    
    @JsonIgnore
    @OneToMany(mappedBy = "product")
    private List<OrderDetail> orderDetails;
}
