package com.cafeapp.service.impl;

import com.cafeapp.model.Product;
import com.cafeapp.repository.ProductRepository;
import com.cafeapp.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements ProductService {
    
    private final ProductRepository productRepository;
    
    @Autowired
    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }
    
    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }
    
    @Override
    public Optional<Product> getProductById(Integer id) {
        return productRepository.findById(id);
    }
    
    @Override
    public List<Product> getProductsByCategory(Integer categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }
    
    @Override
    public List<Product> getAvailableProducts() {
        return productRepository.findByIsAvailable(true);
    }
    
    @Override
    public List<Product> searchProducts(String keyword) {
        return productRepository.searchByName(keyword);
    }
    
    @Override
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
    
    @Override
    public void deleteProduct(Integer id) {
        productRepository.deleteById(id);
    }
    
    @Override
    public void updateProductAvailability(Integer id, boolean isAvailable) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            product.setIsAvailable(isAvailable);
            productRepository.save(product);
        }
    }
} 