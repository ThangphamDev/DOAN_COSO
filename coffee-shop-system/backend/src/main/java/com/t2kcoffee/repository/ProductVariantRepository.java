package com.t2kcoffee.repository;

import com.t2kcoffee.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Integer> {
    
    // Tìm theo loại biến thể và danh mục, sắp xếp theo thứ tự hiển thị
    List<ProductVariant> findByVariantTypeAndCategoryIdCategoryOrderByDisplayOrderAsc(String variantType, Integer categoryId);
    
    // Tìm tất cả biến thể theo danh mục, sắp xếp theo loại và thứ tự hiển thị
    List<ProductVariant> findByCategoryIdCategoryOrderByVariantTypeAscDisplayOrderAsc(Integer categoryId);
    
    // Tìm biến thể mặc định theo loại và danh mục
    Optional<ProductVariant> findByVariantTypeAndCategoryIdCategoryAndIsDefaultTrue(String variantType, Integer categoryId);
    
    // Tìm các biến thể mặc định theo loại và danh mục, ngoại trừ một ID cụ thể
    List<ProductVariant> findByVariantTypeAndCategoryIdCategoryAndIsDefaultTrueAndIdVariantNot(String variantType, Integer categoryId, Integer idVariant);
    
    // Lấy danh sách các loại biến thể duy nhất
    @Query("SELECT DISTINCT v.variantType FROM ProductVariant v ORDER BY v.variantType")
    List<String> findDistinctVariantType();
} 