package com.t2k.coffee.repository;

import com.t2k.coffee.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByCategoryId(Integer categoryId);
    List<Product> findByIsAvailable(Boolean isAvailable);
    List<Product> findByProductNameContaining(String keyword);
} 