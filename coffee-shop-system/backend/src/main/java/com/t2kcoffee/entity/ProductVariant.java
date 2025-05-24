package com.t2kcoffee.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "product_variants")
public class ProductVariant implements Serializable {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_variant")
    private Integer idVariant;
    
    @Column(name = "variant_type", nullable = false)
    private String variantType;  
    
    @Column(name = "variant_name", nullable = false)
    private String variantName; 
    
    @Column(name = "variant_value", nullable = false)
    private String variantValue;  
    
    @Column(name = "additional_price")
    private Double additionalPrice; 
    
    @Column(name = "is_default")
    private Boolean isDefault;  
    
    @Column(name = "display_order")
    private Integer displayOrder;  
    
   
    @ManyToOne
    @JoinColumn(name = "id_category")
    private Category category; 
    
 
    public ProductVariant() {
    }
    
    public ProductVariant(String variantType, String variantName, String variantValue, Double additionalPrice, Boolean isDefault, Integer displayOrder, Category category) {
        this.variantType = variantType;
        this.variantName = variantName;
        this.variantValue = variantValue;
        this.additionalPrice = additionalPrice;
        this.isDefault = isDefault;
        this.displayOrder = displayOrder;
        this.category = category;
    }
    
    // Getters and Setters
    public Integer getIdVariant() {
        return idVariant;
    }
    
    public void setIdVariant(Integer idVariant) {
        this.idVariant = idVariant;
    }
    
    public String getVariantType() {
        return variantType;
    }
    
    public void setVariantType(String variantType) {
        this.variantType = variantType;
    }
    
    public String getVariantName() {
        return variantName;
    }
    
    public void setVariantName(String variantName) {
        this.variantName = variantName;
    }
    
    public String getVariantValue() {
        return variantValue;
    }
    
    public void setVariantValue(String variantValue) {
        this.variantValue = variantValue;
    }
    
    public Double getAdditionalPrice() {
        return additionalPrice;
    }
    
    public void setAdditionalPrice(Double additionalPrice) {
        this.additionalPrice = additionalPrice;
    }
    
    public Boolean getIsDefault() {
        return isDefault;
    }
    
    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }
    
    public Integer getDisplayOrder() {
        return displayOrder;
    }
    
    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
    
    public Category getCategory() {
        return category;
    }
    
    public void setCategory(Category category) {
        this.category = category;
    }
    
    @Override
    public String toString() {
        return "ProductVariant{" +
                "idVariant=" + idVariant +
                ", variantType='" + variantType + '\'' +
                ", variantName='" + variantName + '\'' +
                ", variantValue='" + variantValue + '\'' +
                ", additionalPrice=" + additionalPrice +
                ", isDefault=" + isDefault +
                ", displayOrder=" + displayOrder +
                '}';
    }
} 