package com.t2kcoffee.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;

@Embeddable
@Data
public class OrderDetailId implements java.io.Serializable {
    @Column(name = "ID_Product")
    private Integer idProduct;
    
    @Column(name = "ID_Order")
    private Integer idOrder;
    
    // Constructors
    public OrderDetailId() {}
    
    public OrderDetailId(Integer idProduct, Integer idOrder) {
        this.idProduct = idProduct;
        this.idOrder = idOrder;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OrderDetailId that = (OrderDetailId) o;
        return idProduct.equals(that.idProduct) && idOrder.equals(that.idOrder);
    }
    
    @Override
    public int hashCode() {
        return idProduct.hashCode() ^ idOrder.hashCode();
    }
} 