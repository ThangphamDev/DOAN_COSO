package com.t2kcoffee.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CategoryDTO {
    @JsonProperty(value = "idCategory", access = JsonProperty.Access.READ_WRITE)
    private Integer idCategory;
    
    @JsonProperty(value = "categoryName", access = JsonProperty.Access.READ_WRITE)
    private String categoryName;
    
    private String description;
    
    // Getter methods để frontend có thể dùng cả "id" và "name"
    @JsonProperty("id")
    public Integer getId() {
        return idCategory;
    }
    
    @JsonProperty("name")
    public String getName() {
        return categoryName;
    }
}

