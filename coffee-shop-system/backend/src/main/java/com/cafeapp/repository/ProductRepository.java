package com.cafeapp.repository;

import com.cafeapp.model.Category;
import com.cafeapp.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Integer> {
    
    List<Product> findByCategory(Category category);
    
    List<Product> findByCategoryId(Integer categoryId);
    
    List<Product> findByIsAvailable(Boolean isAvailable);
    
    List<Product> findByNameContaining(String name);
    
    @Query("SELECT p FROM Product p WHERE p.category.id = ?1 AND p.isAvailable = true")
    List<Product> findAvailableProductsByCategory(Integer categoryId);
    
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', ?1, '%'))")
    List<Product> searchByName(String keyword);
} 