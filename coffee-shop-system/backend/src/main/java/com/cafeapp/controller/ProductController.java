package com.cafeapp.controller;

import com.cafeapp.model.Category;
import com.cafeapp.model.Product;
import com.cafeapp.service.CategoryService;
import com.cafeapp.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {
    
    private final ProductService productService;
    private final CategoryService categoryService;
    
    @Autowired
    public ProductController(ProductService productService, CategoryService categoryService) {
        this.productService = productService;
        this.categoryService = categoryService;
    }
    
    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String keyword) {
        
        List<Product> products;
        
        if (categoryId != null) {
            products = productService.getProductsByCategory(categoryId);
        } else if (available != null && available) {
            products = productService.getAvailableProducts();
        } else if (keyword != null && !keyword.trim().isEmpty()) {
            products = productService.searchProducts(keyword);
        } else {
            products = productService.getAllProducts();
        }
        
        return new ResponseEntity<>(products, HttpStatus.OK);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Integer id) {
        Optional<Product> productOpt = productService.getProductById(id);
        if (productOpt.isPresent()) {
            return new ResponseEntity<>(productOpt.get(), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    @PostMapping
    public ResponseEntity<?> createProduct(
            @RequestParam("name") String name,
            @RequestParam("price") BigDecimal price,
            @RequestParam("categoryId") Integer categoryId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        Optional<Category> categoryOpt = categoryService.getCategoryById(categoryId);
        if (!categoryOpt.isPresent()) {
            return new ResponseEntity<>("Danh mục không tồn tại", HttpStatus.BAD_REQUEST);
        }
        
        Product product = new Product();
        product.setName(name);
        product.setPrice(price);
        product.setCategory(categoryOpt.get());
        product.setDescription(description);
        product.setIsAvailable(true);
        
        if (image != null && !image.isEmpty()) {
            try {
                product.setImage(image.getBytes());
            } catch (IOException e) {
                return new ResponseEntity<>("Không thể tải lên hình ảnh", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        
        Product savedProduct = productService.saveProduct(product);
        return new ResponseEntity<>(savedProduct, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Integer id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "price", required = false) BigDecimal price,
            @RequestParam(value = "categoryId", required = false) Integer categoryId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "isAvailable", required = false) Boolean isAvailable,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        Optional<Product> existingProductOpt = productService.getProductById(id);
        if (!existingProductOpt.isPresent()) {
            return new ResponseEntity<>("Không tìm thấy sản phẩm với ID đã cho", HttpStatus.NOT_FOUND);
        }
        
        Product existingProduct = existingProductOpt.get();
        
        if (name != null) {
            existingProduct.setName(name);
        }
        
        if (price != null) {
            existingProduct.setPrice(price);
        }
        
        if (categoryId != null) {
            Optional<Category> categoryOpt = categoryService.getCategoryById(categoryId);
            if (!categoryOpt.isPresent()) {
                return new ResponseEntity<>("Danh mục không tồn tại", HttpStatus.BAD_REQUEST);
            }
            existingProduct.setCategory(categoryOpt.get());
        }
        
        if (description != null) {
            existingProduct.setDescription(description);
        }
        
        if (isAvailable != null) {
            existingProduct.setIsAvailable(isAvailable);
        }
        
        if (image != null && !image.isEmpty()) {
            try {
                existingProduct.setImage(image.getBytes());
            } catch (IOException e) {
                return new ResponseEntity<>("Không thể tải lên hình ảnh", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
        
        Product updatedProduct = productService.saveProduct(existingProduct);
        return new ResponseEntity<>(updatedProduct, HttpStatus.OK);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Integer id) {
        Optional<Product> productOpt = productService.getProductById(id);
        if (!productOpt.isPresent()) {
            return new ResponseEntity<>("Không tìm thấy sản phẩm với ID đã cho", HttpStatus.NOT_FOUND);
        }
        
        productService.deleteProduct(id);
        return new ResponseEntity<>("Đã xóa sản phẩm thành công", HttpStatus.OK);
    }
    
    @PatchMapping("/{id}/availability")
    public ResponseEntity<?> updateProductAvailability(
            @PathVariable Integer id,
            @RequestParam Boolean isAvailable) {
        
        Optional<Product> productOpt = productService.getProductById(id);
        if (!productOpt.isPresent()) {
            return new ResponseEntity<>("Không tìm thấy sản phẩm với ID đã cho", HttpStatus.NOT_FOUND);
        }
        
        productService.updateProductAvailability(id, isAvailable);
        return new ResponseEntity<>("Đã cập nhật trạng thái sản phẩm thành công", HttpStatus.OK);
    }
} 