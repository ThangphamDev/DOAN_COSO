package com.t2kcoffee.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderDetailDTO {
    private Integer productId;
    private Integer orderId;
    private ProductDTO product;  // Product info để mobile hiển thị
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private String size;
    private String icePercent;
    private String sugarPercent;
    private String toppings;
    private BigDecimal additionalPrice;
    private String variantNote;
}

