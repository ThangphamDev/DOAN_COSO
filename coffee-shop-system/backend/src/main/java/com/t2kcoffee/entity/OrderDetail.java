package com.t2kcoffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Table(name = "order_detail")
public class OrderDetail {
    @EmbeddedId
    private OrderDetailId id;
    
    @ManyToOne
    @MapsId("idProduct")
    @JoinColumn(name = "ID_Product")
    @JsonIgnore
    private Product product;
    
    @ManyToOne
    @MapsId("idOrder")
    @JoinColumn(name = "ID_Order")
    @JsonIgnore
    private CafeOrder order;
    
    @Column(name = "Quantity")
    private Integer quantity;
    
    @Column(name = "Unit_Price")
    private BigDecimal unitPrice;
    
    @Column(name = "Subtotal", insertable = false, updatable = false)
    private BigDecimal subtotal;
    
    @Column(name = "size")
    private String size;
    
    @Column(name = "ice_percent")
    private String icePercent;
    
    @Column(name = "sugar_percent")
    private String sugarPercent;
    
    @Column(name = "toppings")
    private String toppings;
    
    @Column(name = "additional_price")
    private BigDecimal additionalPrice;
    
    @Column(name = "variant_note")
    private String variantNote;
} 