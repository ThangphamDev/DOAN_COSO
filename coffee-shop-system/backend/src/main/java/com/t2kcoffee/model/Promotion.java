package com.t2kcoffee.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Table(name = "promotion")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID_Promotion")
    private Integer idPromotion;

    @Column(name = "Name_Promotion")
    private String namePromotion;
    
    @Column(name = "Code")
    private String code;
    
    @Column(name = "Start_Date")
    @Temporal(TemporalType.DATE)
    private Date startDate;
    
    @Column(name = "End_Date")
    @Temporal(TemporalType.DATE)
    private Date endDate;
    
    @Column(name = "Is_Active")
    private Boolean isActive = true;
    
    @JsonIgnore
    @OneToMany(mappedBy = "promotion")
    private List<CafeOrder> orders;
} 