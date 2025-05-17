package com.t2kcoffee.model;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "order_variants")
public class OrderVariant implements Serializable {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_order_variant")
    private Integer idOrderVariant;
    
    @ManyToOne
    @JoinColumns({
        @JoinColumn(name = "id_order", referencedColumnName = "id_order"),
        @JoinColumn(name = "id_product", referencedColumnName = "id_product")
    })
    private OrderDetail orderDetail;
    
    @Column(name = "size")
    private String size;  
    
    @Column(name = "ice_percent")
    private Integer icePercent;  
    
    @Column(name = "sugar_percent")
    private Integer sugarPercent;  
    
    @Column(name = "toppings")
    private String toppings; 
    
    @Column(name = "additional_price")
    private Double additionalPrice; 
    
    @Column(name = "variant_note")
    private String variantNote; 
    

    public OrderVariant() {
    }
    
    public OrderVariant(OrderDetail orderDetail, String size, Integer icePercent, Integer sugarPercent, String toppings, Double additionalPrice, String variantNote) {
        this.orderDetail = orderDetail;
        this.size = size;
        this.icePercent = icePercent;
        this.sugarPercent = sugarPercent;
        this.toppings = toppings;
        this.additionalPrice = additionalPrice;
        this.variantNote = variantNote;
    }
    
    // Getters and Setters
    public Integer getIdOrderVariant() {
        return idOrderVariant;
    }
    
    public void setIdOrderVariant(Integer idOrderVariant) {
        this.idOrderVariant = idOrderVariant;
    }
    
    public OrderDetail getOrderDetail() {
        return orderDetail;
    }
    
    public void setOrderDetail(OrderDetail orderDetail) {
        this.orderDetail = orderDetail;
    }
    
    public String getSize() {
        return size;
    }
    
    public void setSize(String size) {
        this.size = size;
    }
    
    public Integer getIcePercent() {
        return icePercent;
    }
    
    public void setIcePercent(Integer icePercent) {
        this.icePercent = icePercent;
    }
    
    public Integer getSugarPercent() {
        return sugarPercent;
    }
    
    public void setSugarPercent(Integer sugarPercent) {
        this.sugarPercent = sugarPercent;
    }
    
    public String getToppings() {
        return toppings;
    }
    
    public void setToppings(String toppings) {
        this.toppings = toppings;
    }
    
    public Double getAdditionalPrice() {
        return additionalPrice;
    }
    
    public void setAdditionalPrice(Double additionalPrice) {
        this.additionalPrice = additionalPrice;
    }
    
    public String getVariantNote() {
        return variantNote;
    }
    
    public void setVariantNote(String variantNote) {
        this.variantNote = variantNote;
    }
    
    @Override
    public String toString() {
        return "OrderVariant{" +
                "idOrderVariant=" + idOrderVariant +
                ", size='" + size + '\'' +
                ", icePercent=" + icePercent +
                ", sugarPercent=" + sugarPercent +
                ", toppings='" + toppings + '\'' +
                ", additionalPrice=" + additionalPrice +
                ", variantNote='" + variantNote + '\'' +
                '}';
    }
} 