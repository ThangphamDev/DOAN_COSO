package com.t2kcoffee.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idAccount;

    private String userName;
    private String fullName;
    private String passWord;
    private String phone;
    private String address;

    @Lob
    private byte[] image;

    private String role;
}
