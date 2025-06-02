package com.t2kcoffee.controller;

import com.t2kcoffee.entity.Product;
import com.t2kcoffee.service.ProductService;
import com.t2kcoffee.dto.ProductDTO;
import com.t2kcoffee.entity.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;
    
    @Value("${app.upload.dir:./uploads/images}")
    private String uploadDir;

    @Autowired
    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // Hàm chuyển đổi Product -> ProductDTO
    private ProductDTO toDTO(Product product) {
        ProductDTO dto = new ProductDTO();
        dto.setIdProduct(product.getIdProduct());
        dto.setProductName(product.getProductName());
        dto.setPrice(product.getPrice());
        dto.setDescription(product.getDescription());
        dto.setIsAvailable(product.getIsAvailable());
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getIdCategory());
            dto.setCategoryName(product.getCategory().getCategoryName());
        }
        
        // Chỉ cần gán trực tiếp đường dẫn ảnh
        dto.setImage(product.getImage());
        
        return dto;
    }

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getAllProducts() {
        List<Product> products = productService.getAllProducts();
        List<ProductDTO> dtos = products.stream().map(this::toDTO).collect(Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Integer id) {
        Optional<Product> product = productService.getProductById(id);
        return product.map(value -> new ResponseEntity<>(toDTO(value), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<ProductDTO>> getProductsByCategory(@PathVariable Integer categoryId) {
        List<Product> products = productService.getProductsByCategory(categoryId);
        List<ProductDTO> dtos = products.stream().map(this::toDTO).collect(Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @GetMapping("/available")
    public ResponseEntity<List<ProductDTO>> getAvailableProducts() {
        List<Product> products = productService.getAvailableProducts();
        List<ProductDTO> dtos = products.stream().map(this::toDTO).collect(Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProductDTO>> searchProducts(@RequestParam String keyword) {
        List<Product> products = productService.searchProducts(keyword);
        List<ProductDTO> dtos = products.stream().map(this::toDTO).collect(Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<ProductDTO> createProduct(@RequestBody ProductDTO productDTO) {
        Product product = new Product();
        product.setProductName(productDTO.getProductName());
        product.setPrice(productDTO.getPrice());
        product.setDescription(productDTO.getDescription());
        product.setIsAvailable(productDTO.getIsAvailable());
        // Gán category từ categoryId
        if (productDTO.getCategoryId() != null) {
            Category category = new Category();
            category.setIdCategory(productDTO.getCategoryId());
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
        // ... cập nhật các trường khác nếu có

        Product savedProduct = productService.saveProduct(product);
        return new ResponseEntity<>(toDTO(savedProduct), HttpStatus.CREATED);
    }

    @PostMapping("/with-image")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<Product> createProductWithImage(
            @RequestParam("image") MultipartFile file,
            @RequestParam("productName") String productName,
            @RequestParam("price") Double price,
            @RequestParam("description") String description,
            @RequestParam("categoryId") Integer categoryId,
            @RequestParam(value = "isAvailable", defaultValue = "true") Boolean isAvailable) {
        
        try {
            Product product = new Product();
            product.setProductName(productName);
            product.setPrice(price);
            product.setDescription(description);
            product.setIsAvailable(isAvailable);
            
            // Set the category
            Category category = new Category();
            category.setIdCategory(categoryId);
            product.setCategory(category);
            
            // Lưu sản phẩm trước để có ID
            Product savedProduct = productService.saveProduct(product);
            
            // Sau đó xử lý và lưu ảnh nếu có
            if (!file.isEmpty()) {
                try {
                    // Lưu file vào thư mục và lấy tên file
                    String fileName = productService.storeFile(file, savedProduct.getIdProduct());
                    
                    // Cập nhật đường dẫn ảnh vào sản phẩm
                    savedProduct.setImage(fileName);
                    savedProduct = productService.saveProduct(savedProduct);
                    
                    System.out.println("Đã lưu ảnh thành công cho sản phẩm mới với ID: " + savedProduct.getIdProduct());
                } catch (IOException e) {
                    System.err.println("Lỗi khi lưu ảnh: " + e.getMessage());
                    // Tiếp tục trả về sản phẩm đã lưu, nhưng không có ảnh
                }
            }
            
            return new ResponseEntity<>(savedProduct, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Lỗi khi tạo sản phẩm với ảnh: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable Integer id, @RequestBody ProductDTO productDTO) {
        Optional<Product> existingProduct = productService.getProductById(id);
        if (existingProduct.isPresent()) {
            Product product = existingProduct.get();
            // Chỉ cập nhật nếu DTO có giá trị khác null
            if (productDTO.getProductName() != null) product.setProductName(productDTO.getProductName());
            if (productDTO.getPrice() != null) product.setPrice(productDTO.getPrice());
            if (productDTO.getDescription() != null) product.setDescription(productDTO.getDescription());
            if (productDTO.getIsAvailable() != null) product.setIsAvailable(productDTO.getIsAvailable());
            // Gán lại category từ categoryId nếu có
            if (productDTO.getCategoryId() != null) {
                Category category = new Category();
                category.setIdCategory(productDTO.getCategoryId());
                product.setCategory(category);
            }
            // ... cập nhật các trường khác nếu có

            Product updatedProduct = productService.saveProduct(product);
            return new ResponseEntity<>(toDTO(updatedProduct), HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/{id}/availability")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<Product> updateProductAvailability(
            @PathVariable Integer id, 
            @RequestParam boolean isAvailable) {
        
        Product updatedProduct = productService.updateProductAvailability(id, isAvailable);
        if (updatedProduct != null) {
            return new ResponseEntity<>(updatedProduct, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Integer id) {
        Optional<Product> product = productService.getProductById(id);
        if (product.isPresent()) {
            productService.deleteProduct(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_STAFF')")
    public ResponseEntity<ProductDTO> updateProductImage(@PathVariable Integer id, @RequestParam("image") MultipartFile file) {
        if (file.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        Optional<Product> productOpt = productService.getProductById(id);
        if (!productOpt.isPresent()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        try {
            Product product = productOpt.get();
            String fileName = productService.storeFile(file, id);
            product.setImage(fileName);
            Product updatedProduct = productService.saveProduct(product);
            return new ResponseEntity<>(toDTO(updatedProduct), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/images/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG) // Adjust content type as necessary
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
