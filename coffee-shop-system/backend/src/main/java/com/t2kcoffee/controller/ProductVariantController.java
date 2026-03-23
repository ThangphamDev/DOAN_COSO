package com.t2kcoffee.controller;

import com.t2kcoffee.entity.ProductVariant;
import com.t2kcoffee.entity.Category;
import com.t2kcoffee.service.ProductVariantService;
import com.t2kcoffee.service.CategoryService;
import com.t2kcoffee.dto.VariantResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/variants")
@CrossOrigin(origins = "*")
public class ProductVariantController {

    private final ProductVariantService productVariantService;
    private final CategoryService categoryService;

    @Autowired
    public ProductVariantController(ProductVariantService productVariantService, CategoryService categoryService) {
        this.productVariantService = productVariantService;
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<ProductVariant>> getAllVariants() {
        List<ProductVariant> variants = productVariantService.getAllVariants();
        return new ResponseEntity<>(variants, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductVariant> getVariantById(@PathVariable Integer id) {
        Optional<ProductVariant> variant = productVariantService.getVariantById(id);
        return variant.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/types")
    public ResponseEntity<List<String>> getAllVariantTypes() {
        List<String> types = productVariantService.getAllVariantTypes();
        return new ResponseEntity<>(types, HttpStatus.OK);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<VariantResponse> getVariantsByCategory(@PathVariable Integer categoryId) {
        List<ProductVariant> variants = productVariantService.getVariantsByCategory(categoryId);
        
        if (variants.isEmpty()) {
            // Nếu không có biến thể, tạo mẫu dữ liệu mặc định
            return new ResponseEntity<>(createDefaultVariantResponse(categoryId), HttpStatus.OK);
        }
        
        // Tạo response từ dữ liệu trong DB
        VariantResponse response = new VariantResponse();
        
        // Nhóm biến thể theo loại
        Map<String, List<ProductVariant>> variantsByType = variants.stream()
                .collect(Collectors.groupingBy(ProductVariant::getVariantType));
        
        // Xử lý kích thước
        if (variantsByType.containsKey("size")) {
            response.setSizes(convertToVariantMap(variantsByType.get("size")));
        } else {
            response.setSizes(createDefaultSizes());
        }
        
        // Xử lý đá
        if (variantsByType.containsKey("ice")) {
            response.setIce(convertToVariantMap(variantsByType.get("ice")));
        } else {
            response.setIce(createDefaultIce());
        }
        
        // Xử lý đường
        if (variantsByType.containsKey("sugar")) {
            response.setSugar(convertToVariantMap(variantsByType.get("sugar")));
        } else {
            response.setSugar(createDefaultSugar());
        }
        
        // Xử lý topping
        if (variantsByType.containsKey("topping")) {
            response.setToppings(convertToVariantMap(variantsByType.get("topping")));
        } else {
            response.setToppings(createDefaultToppings());
        }
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ProductVariant> createVariant(@RequestBody ProductVariant variant) {
        // Kiểm tra xem danh mục có tồn tại không
        if (variant.getCategory() != null && variant.getCategory().getIdCategory() != null) {
            Optional<Category> category = categoryService.getCategoryById(variant.getCategory().getIdCategory());
            if (category.isEmpty()) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
        }
        
        // Xử lý đặt mặc định nếu cần
        if (Boolean.TRUE.equals(variant.getIsDefault())) {
            // Đảm bảo không có biến thể nào khác cùng loại và danh mục được đặt là mặc định
            List<ProductVariant> existingDefaults = productVariantService.getVariantsByTypeAndCategory(
                    variant.getVariantType(), variant.getCategory().getIdCategory())
                    .stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsDefault()))
                    .collect(Collectors.toList());
            
            existingDefaults.forEach(v -> {
                v.setIsDefault(false);
                productVariantService.saveVariant(v);
            });
        }
        
        ProductVariant savedVariant = productVariantService.saveVariant(variant);
        return new ResponseEntity<>(savedVariant, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductVariant> updateVariant(@PathVariable Integer id, @RequestBody ProductVariant variant) {
        Optional<ProductVariant> existingVariant = productVariantService.getVariantById(id);
        if (existingVariant.isPresent()) {
            variant.setIdVariant(id); // Đảm bảo ID được giữ nguyên
            
            // Xử lý đặt mặc định nếu cần
            if (Boolean.TRUE.equals(variant.getIsDefault())) {
                productVariantService.updateDefaultVariant(id, true);
            }
            
            ProductVariant updatedVariant = productVariantService.saveVariant(variant);
            return new ResponseEntity<>(updatedVariant, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVariant(@PathVariable Integer id) {
        Optional<ProductVariant> variant = productVariantService.getVariantById(id);
        if (variant.isPresent()) {
            productVariantService.deleteVariant(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<ProductVariant> updateDefaultStatus(@PathVariable Integer id, @RequestParam boolean isDefault) {
        ProductVariant updatedVariant = productVariantService.updateDefaultVariant(id, isDefault);
        if (updatedVariant != null) {
            return new ResponseEntity<>(updatedVariant, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Phương thức hỗ trợ để tạo đối tượng VariantResponse mặc định
    private VariantResponse createDefaultVariantResponse(Integer categoryId) {
        VariantResponse response = new VariantResponse();
        response.setSizes(createDefaultSizes());
        response.setIce(createDefaultIce());
        response.setSugar(createDefaultSugar());
        response.setToppings(createDefaultToppings());
        return response;
    }

    // Chuyển đổi danh sách biến thể thành định dạng phản hồi
    private List<Map<String, Object>> convertToVariantMap(List<ProductVariant> variants) {
        return variants.stream().map(v -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", v.getIdVariant());
            map.put("name", v.getVariantName());
            map.put("value", v.getVariantValue());
            map.put("price", v.getAdditionalPrice());
            map.put("isDefault", v.getIsDefault());
            return map;
        }).collect(Collectors.toList());
    }

    // Tạo dữ liệu kích thước mặc định
    private List<Map<String, Object>> createDefaultSizes() {
        List<Map<String, Object>> sizes = new ArrayList<>();
        
        Map<String, Object> sizeS = new HashMap<>();
        sizeS.put("name", "S");
        sizeS.put("value", "S");
        sizeS.put("price", 0);
        sizeS.put("isDefault", true);
        
        Map<String, Object> sizeM = new HashMap<>();
        sizeM.put("name", "M");
        sizeM.put("value", "M");
        sizeM.put("price", 5000);
        sizeM.put("isDefault", false);
        
        Map<String, Object> sizeL = new HashMap<>();
        sizeL.put("name", "L");
        sizeL.put("value", "L");
        sizeL.put("price", 10000);
        sizeL.put("isDefault", false);
        
        sizes.add(sizeS);
        sizes.add(sizeM);
        sizes.add(sizeL);
        
        return sizes;
    }

    // Tạo dữ liệu đá mặc định
    private List<Map<String, Object>> createDefaultIce() {
        List<Map<String, Object>> iceOptions = new ArrayList<>();
        
        String[] percentages = {"100", "70", "50", "30", "0"};
        boolean isFirst = true;
        
        for (String percent : percentages) {
            Map<String, Object> ice = new HashMap<>();
            ice.put("name", percent + "% đá");
            ice.put("value", percent);
            ice.put("price", 0);
            ice.put("isDefault", isFirst);
            iceOptions.add(ice);
            isFirst = false;
        }
        
        return iceOptions;
    }

    // Tạo dữ liệu đường mặc định
    private List<Map<String, Object>> createDefaultSugar() {
        List<Map<String, Object>> sugarOptions = new ArrayList<>();
        
        String[] percentages = {"100", "70", "50", "30", "0"};
        boolean isFirst = true;
        
        for (String percent : percentages) {
            Map<String, Object> sugar = new HashMap<>();
            sugar.put("name", percent + "% đường");
            sugar.put("value", percent);
            sugar.put("price", 0);
            sugar.put("isDefault", isFirst);
            sugarOptions.add(sugar);
            isFirst = false;
        }
        
        return sugarOptions;
    }

    // Tạo dữ liệu topping mặc định
    private List<Map<String, Object>> createDefaultToppings() {
        List<Map<String, Object>> toppings = new ArrayList<>();
        
        Map<String, Object> tranchau = new HashMap<>();
        tranchau.put("name", "Trân châu đen");
        tranchau.put("value", "tranchau");
        tranchau.put("price", 10000);
        tranchau.put("isDefault", false);
        
        Map<String, Object> thachcafe = new HashMap<>();
        thachcafe.put("name", "Thạch cà phê");
        thachcafe.put("value", "thachcafe");
        thachcafe.put("price", 10000);
        thachcafe.put("isDefault", false);
        
        Map<String, Object> flan = new HashMap<>();
        flan.put("name", "Bánh flan");
        flan.put("value", "flan");
        flan.put("price", 15000);
        flan.put("isDefault", false);
        
        toppings.add(tranchau);
        toppings.add(thachcafe);
        toppings.add(flan);
        
        return toppings;
    }
} 