package com.cafeapp.model;

import javax.persistence.*;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "product")
public class Product {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Product")
    private Integer id;
    
    @Column(name = "Product_Name", nullable = false)
    private String name;
    
    @Column(name = "Price", nullable = false)
    private BigDecimal price;
    
    @Column(name = "Description")
    private String description;
    
    @Lob
    @Column(name = "Image")
    private byte[] image;
    
    @Column(name = "Is_Available")
    private Boolean isAvailable = true;
    
    @ManyToOne
    @JoinColumn(name = "ID_Category")
    private Category category;
    
    @OneToMany(mappedBy = "product")
    private List<OrderDetail> orderDetails;
    
    // Constructors
    public Product() {
    }
    
    public Product(String name, BigDecimal price, Category category) {
        this.name = name;
        this.price = price;
        this.category = category;
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
    
    public BigDecimal getPrice() {
        return price;
    }
    
    public void setPrice(BigDecimal price) {
        this.price = price;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public byte[] getImage() {
        return image;
    }
    
    public void setImage(byte[] image) {
        this.image = image;
    }
    
    public Boolean getIsAvailable() {
        return isAvailable;
    }
    
    public void setIsAvailable(Boolean isAvailable) {
        this.isAvailable = isAvailable;
    }
    
    public Category getCategory() {
        return category;
    }
    
    public void setCategory(Category category) {
        this.category = category;
    }
    
    public List<OrderDetail> getOrderDetails() {
        return orderDetails;
    }
    
    public void setOrderDetails(List<OrderDetail> orderDetails) {
        this.orderDetails = orderDetails;
    }
} 