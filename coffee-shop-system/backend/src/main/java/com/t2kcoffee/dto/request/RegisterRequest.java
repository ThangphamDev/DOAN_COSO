package com.t2kcoffee.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String userName;

    @NotBlank
    private String fullName;

    @NotBlank
    private String passWord;

    private String phone;
    private String address;
    private String image;
    private String role = "Customer";
    private String status = "active";
} 