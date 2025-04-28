package com.t2kcoffee.model;

import jakarta.persistence.*;
import lombok.Data;

@EntityA
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idProduct;

    private String productName;
    private Double price;
    private String description;

    @Lob
    private byte[] image;

    private Boolean isAvailable = true;

    private Integer idCategory;
}
