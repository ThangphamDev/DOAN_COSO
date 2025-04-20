package com.cafeapp.model;

import javax.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "orderdetail")
public class OrderDetail {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_OrderDetail")
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "ID_Order")
    private Order order;
    
    @ManyToOne
    @JoinColumn(name = "ID_Product")
    private Product product;
    
    @Column(name = "Quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "Unit_Price", nullable = false)
    private BigDecimal unitPrice;
    
    @Column(name = "Subtotal", nullable = false)
    private BigDecimal subtotal;
    
    // Constructors
    public OrderDetail() {
    }
    
    public OrderDetail(Order order, Product product, Integer quantity) {
        this.order = order;
        this.product = product;
        this.quantity = quantity;
        this.unitPrice = product.getPrice();
        this.subtotal = this.unitPrice.multiply(new BigDecimal(quantity));
    }
    
    // Getters and Setters
    public Integer getId() {
        return id;
    }
    
    public void setId(Integer id) {
        this.id = id;
    }
    
    public Order getOrder() {
        return order;
    }
    
    public void setOrder(Order order) {
        this.order = order;
    }
    
    public Product getProduct() {
        return product;
    }
    
    public void setProduct(Product product) {
        this.product = product;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        // Recalculate subtotal when quantity changes
        if (this.unitPrice != null) {
            this.subtotal = this.unitPrice.multiply(new BigDecimal(quantity));
        }
    }
    
    public BigDecimal getUnitPrice() {
        return unitPrice;
    }
    
    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
        // Recalculate subtotal when unit price changes
        if (this.quantity != null) {
            this.subtotal = unitPrice.multiply(new BigDecimal(this.quantity));
        }
    }
    
    public BigDecimal getSubtotal() {
        return subtotal;
    }
    
    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
    
    // Helper method to recalculate subtotal
    public void calculateSubtotal() {
        if (this.quantity == null || this.unitPrice == null) {
            this.subtotal = BigDecimal.ZERO;
            return;
        }
        this.subtotal = this.unitPrice.multiply(new BigDecimal(this.quantity));
    }
} 