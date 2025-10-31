package com.t2kcoffee.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Data
public class CafeOrderDTO {
    private Integer idOrder;
    private Integer idTable;
    private String tableNumber;
    private Integer quantity;
    private Date orderTime;
    private BigDecimal totalAmount;
    private String note;
    private String status;
    private Integer idAccount;
    private String customerName;
    private Integer idPromotion;
    private PaymentDTO payment;
    private List<OrderDetailDTO> orderDetails;  // Với Product info đầy đủ
}

