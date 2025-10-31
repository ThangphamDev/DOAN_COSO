package com.t2kcoffee.dto;

import lombok.Data;
import java.util.Date;

@Data
public class PaymentDTO {
    private Integer idPayment;
    private Date createAt;
    private String paymentMethod;
    private String paymentStatus;
}

