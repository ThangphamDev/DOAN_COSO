package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "order_detail")
public class OrderDetail {
    @EmbeddedId
    private OrderDetailId id;

    private Integer quantity;
    
    @Column(name = "unit_price")
    private BigDecimal unitPrice;
    
    private BigDecimal subtotal;
    private String size;
    
    @Column(name = "ice_percent")
    private String icePercent;
    
    @Column(name = "sugar_percent")
    private String sugarPercent;
    
    private String toppings;
    
    @Column(name = "additional_price")
    private BigDecimal additionalPrice;
    
    @Column(name = "variant_note")
    private String variantNote;

    @ManyToOne
    @MapsId("productId")
    @JoinColumn(name = "ID_Product")
    private Product product;

    @ManyToOne
    @MapsId("orderId")
    @JoinColumn(name = "ID_Order")
    private CafeOrder order;
} 