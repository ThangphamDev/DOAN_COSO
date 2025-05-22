package com.t2k.coffee.service;

import com.t2k.coffee.entity.Product;
import com.t2k.coffee.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Optional<Product> getProductById(Integer id) {
        return productRepository.findById(id);
    }

    public List<Product> getProductsByCategory(Integer categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    public List<Product> getAvailableProducts() {
        return productRepository.findByIsAvailable(true);
    }

    public List<Product> searchProducts(String keyword) {
        return productRepository.findByProductNameContaining(keyword);
    }

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public Product updateProduct(Integer id, Product product) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found");
        }
        product.setId(id);
        return productRepository.save(product);
    }

    public void deleteProduct(Integer id) {
        productRepository.deleteById(id);
    }

    public Product updateProductAvailability(Integer id, Boolean isAvailable) {
        Product product = productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setIsAvailable(isAvailable);
        return productRepository.save(product);
    }
} 