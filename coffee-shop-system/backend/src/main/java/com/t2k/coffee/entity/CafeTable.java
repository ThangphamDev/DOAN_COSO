package com.t2k.coffee.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "cafetable")
public class CafeTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Table")
    private Integer id;

    private String status;
    private Integer capacity;
    private String location;
    
    @Column(name = "table_number")
    private Integer tableNumber;
} 