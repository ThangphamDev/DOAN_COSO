package com.t2kcoffee.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
public class ProductDTO {
    private Integer idProduct;
    private String productName;
    private Double price;
    private String description;
    private Boolean isAvailable;
    private Integer categoryId;
    private String categoryName;
    private String image;
    // Có thể bổ sung các trường khác nếu cần
} 