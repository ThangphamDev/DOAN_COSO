package com.t2k.coffee.repository;

import com.t2k.coffee.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer> {
    Category findByCategoryName(String categoryName);
} 