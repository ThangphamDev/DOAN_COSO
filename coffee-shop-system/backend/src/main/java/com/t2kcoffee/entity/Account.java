package com.t2kcoffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Table(name = "account")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Account")
    private Integer idAccount;

    @Column(name = "user_name")
    private String userName;
    
    @Column(name = "full_name")
    private String fullName;
    
    @Column(name = "pass_word")
    private String passWord;
    
    @Column(name = "phone")
    private String phone;
    
    @Column(name = "address")
    private String address;

    @Column(name = "image")
    private String image;

    @Column(name = "role")
    private String role;
    
    @Column(name = "reward_points")
    private Integer rewardPoints = 0;
    
    @Column(name = "status")
    private String status = "active";
    
    @JsonIgnore
    @OneToMany(mappedBy = "account")
    private List<CafeOrder> orders;
    
    // Helper method to get id as per standard Java bean naming
    public Integer getId() {
        return idAccount;
    }
}
