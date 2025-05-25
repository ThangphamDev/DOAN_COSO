package com.t2kcoffee.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Table(name = "cafetable")
public class CafeTable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Table")
    private Integer idTable;

    @Column(name = "Status")
    private String status;
    
    @Column(name = "Capacity")
    private Integer capacity;
    
    @Column(name = "Location")
    private String location;
    
    @Column(name = "Table_Number")
    private Integer tableNumber;
    
    @JsonIgnore
    @OneToMany(mappedBy = "table")
    private List<CafeOrder> orders;

    public Integer getTableNumber() {
        return tableNumber;
    }
} 