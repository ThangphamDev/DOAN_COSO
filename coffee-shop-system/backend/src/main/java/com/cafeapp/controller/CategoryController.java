package com.cafeapp.controller;

import com.cafeapp.model.Category;
import com.cafeapp.service.CategoryService;
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
        List<Category> categories = categoryService.getAllCategories();
        return new ResponseEntity<>(categories, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Integer id) {
        Optional<Category> categoryOpt = categoryService.getCategoryById(id);
        if (categoryOpt.isPresent()) {
            return new ResponseEntity<>(categoryOpt.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        // Kiểm tra xem tên danh mục đã tồn tại chưa
        if (categoryService.existsByName(category.getName())) {
            return new ResponseEntity<>("Tên danh mục đã tồn tại", HttpStatus.BAD_REQUEST);
        }
        
        Category savedCategory = categoryService.saveCategory(category);
        return new ResponseEntity<>(savedCategory, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable Integer id, @RequestBody Category category) {
        Optional<Category> existingCategoryOpt = categoryService.getCategoryById(id);
        if (!existingCategoryOpt.isPresent()) {
            return new ResponseEntity<>("Không tìm thấy danh mục với ID đã cho", HttpStatus.NOT_FOUND);
        }
        
        // Kiểm tra xem tên danh mục mới có trùng với danh mục khác không
        if (!existingCategoryOpt.get().getName().equals(category.getName()) && 
            categoryService.existsByName(category.getName())) {
            return new ResponseEntity<>("Tên danh mục đã tồn tại", HttpStatus.BAD_REQUEST);
        }
        
        category.setId(id);
        Category updatedCategory = categoryService.saveCategory(category);
        return new ResponseEntity<>(updatedCategory, HttpStatus.OK);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable Integer id) {
        Optional<Category> categoryOpt = categoryService.getCategoryById(id);
        if (!categoryOpt.isPresent()) {
            return new ResponseEntity<>("Không tìm thấy danh mục với ID đã cho", HttpStatus.NOT_FOUND);
        }
        
        Category category = categoryOpt.get();
        // Kiểm tra xem danh mục có sản phẩm không
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            return new ResponseEntity<>("Không thể xóa danh mục đang có sản phẩm", HttpStatus.BAD_REQUEST);
        }
        
        categoryService.deleteCategory(id);
        return new ResponseEntity<>("Đã xóa danh mục thành công", HttpStatus.OK);
    }
} 