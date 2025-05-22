package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "account")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Account")
    private Integer id;

    @Column(name = "user_name")
    private String username;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "pass_word")
    private String password;

    private String phone;
    private String address;
    private String image;
    private String role;
    private String status;
} 