package com.t2kcoffee.service;

import com.t2kcoffee.entity.ProductVariant;
import com.t2kcoffee.repository.ProductVariantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductVariantService {

    private final ProductVariantRepository productVariantRepository;

    @Autowired
    public ProductVariantService(ProductVariantRepository productVariantRepository) {
        this.productVariantRepository = productVariantRepository;
    }

    public List<ProductVariant> getAllVariants() {
        return productVariantRepository.findAll();
    }


    public Optional<ProductVariant> getVariantById(Integer id) {
        return productVariantRepository.findById(id);
    }


    public List<ProductVariant> getVariantsByTypeAndCategory(String variantType, Integer categoryId) {
        return productVariantRepository.findByVariantTypeAndCategoryIdCategoryOrderByDisplayOrderAsc(variantType, categoryId);
    }

  
    public List<ProductVariant> getVariantsByCategory(Integer categoryId) {
        return productVariantRepository.findByCategoryIdCategoryOrderByVariantTypeAscDisplayOrderAsc(categoryId);
    }

    
    public List<String> getAllVariantTypes() {
        return productVariantRepository.findDistinctVariantType();
    }

   
    public ProductVariant saveVariant(ProductVariant variant) {
        return productVariantRepository.save(variant);
    }

    
    public void deleteVariant(Integer id) {
        productVariantRepository.deleteById(id);
    }

    
    public Optional<ProductVariant> getDefaultVariantByTypeAndCategory(String variantType, Integer categoryId) {
        return productVariantRepository.findByVariantTypeAndCategoryIdCategoryAndIsDefaultTrue(variantType, categoryId);
    }

    
    public ProductVariant updateDefaultVariant(Integer id, Boolean isDefault) {
        Optional<ProductVariant> optionalVariant = productVariantRepository.findById(id);
        
        if (optionalVariant.isPresent()) {
            ProductVariant variant = optionalVariant.get();
            
            // Nếu đặt làm mặc định, hủy mặc định của các biến thể khác cùng loại và danh mục
            if (isDefault) {
                List<ProductVariant> otherDefaults = productVariantRepository.findByVariantTypeAndCategoryIdCategoryAndIsDefaultTrueAndIdVariantNot(
                    variant.getVariantType(), 
                    variant.getCategory().getIdCategory(), 
                    id
                );
                
                otherDefaults.forEach(v -> {
                    v.setIsDefault(false);
                    productVariantRepository.save(v);
                });
            }
            
            // Cập nhật trạng thái mặc định cho biến thể hiện tại
            variant.setIsDefault(isDefault);
            return productVariantRepository.save(variant);
        }
        
        return null;
    }
} 