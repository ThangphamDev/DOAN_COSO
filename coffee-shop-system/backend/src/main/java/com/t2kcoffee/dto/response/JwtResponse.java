package com.t2kcoffee.dto.response;

import lombok.Data;

@Data
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Integer idAccount;
    private String userName;
    private String fullName;
    private String role;
    private String status;

    public JwtResponse(String accessToken, Integer idAccount, String userName, String fullName, String role, String status) {
        this.token = accessToken;
        this.idAccount = idAccount;
        this.userName = userName;
        this.fullName = fullName;
        this.role = role;
        this.status = status;
    }
} 