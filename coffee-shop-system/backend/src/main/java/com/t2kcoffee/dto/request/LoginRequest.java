package com.t2kcoffee.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank
    private String userName;

    @NotBlank
    private String passWord;
} 