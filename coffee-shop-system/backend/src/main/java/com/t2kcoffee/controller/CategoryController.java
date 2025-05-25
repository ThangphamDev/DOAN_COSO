package com.t2kcoffee.controller;

import com.t2kcoffee.entity.Category;
import com.t2kcoffee.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        System.out.println("Đang xử lý request lấy tất cả danh mục");
        List<Category> categories = categoryService.getAllCategories();
        System.out.println("Số lượng danh mục tìm thấy: " + categories.size());
        return new ResponseEntity<>(categories, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Integer id) {
        Optional<Category> category = categoryService.getCategoryById(id);
        return category.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category) {
        Category savedCategory = categoryService.saveCategory(category);
        return new ResponseEntity<>(savedCategory, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable Integer id, @RequestBody Category category) {
        Optional<Category> existingCategory = categoryService.getCategoryById(id);
        if (existingCategory.isPresent()) {
            category.setIdCategory(id);
            Category updatedCategory = categoryService.saveCategory(category);
            return new ResponseEntity<>(updatedCategory, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        Optional<Category> category = categoryService.getCategoryById(id);
        if (category.isPresent()) {
            categoryService.deleteCategory(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
} 