package com.t2kcoffee.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO để định dạng dữ liệu phản hồi từ API biến thể sản phẩm
 */
public class VariantResponse {
    
    private List<Map<String, Object>> sizes;
    private List<Map<String, Object>> ice;
    private List<Map<String, Object>> sugar;
    private List<Map<String, Object>> toppings;
    
    public VariantResponse() {
    }
    
    public List<Map<String, Object>> getSizes() {
        return sizes;
    }
    
    public void setSizes(List<Map<String, Object>> sizes) {
        this.sizes = sizes;
    }
    
    public List<Map<String, Object>> getIce() {
        return ice;
    }
    
    public void setIce(List<Map<String, Object>> ice) {
        this.ice = ice;
    }
    
    public List<Map<String, Object>> getSugar() {
        return sugar;
    }
    
    public void setSugar(List<Map<String, Object>> sugar) {
        this.sugar = sugar;
    }
    
    public List<Map<String, Object>> getToppings() {
        return toppings;
    }
    
    public void setToppings(List<Map<String, Object>> toppings) {
        this.toppings = toppings;
    }
} 