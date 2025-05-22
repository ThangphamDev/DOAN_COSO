package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;

@Data
@Embeddable
public class OrderDetailId implements Serializable {
    @Column(name = "ID_Product")
    private Integer productId;

    @Column(name = "ID_Order")
    private Integer orderId;

    // Default constructor
    public OrderDetailId() {}

    // Constructor with parameters
    public OrderDetailId(Integer productId, Integer orderId) {
        this.productId = productId;
        this.orderId = orderId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderDetailId that = (OrderDetailId) o;
        return productId.equals(that.productId) && orderId.equals(that.orderId);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(productId, orderId);
    }
} 