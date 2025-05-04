package com.t2kcoffee.controller;

import com.t2kcoffee.model.Promotion;
import com.t2kcoffee.service.PromotionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/promotions")
@CrossOrigin(origins = "*")
public class PromotionController {

    private final PromotionService promotionService;

    @Autowired
    public PromotionController(PromotionService promotionService) {
        this.promotionService = promotionService;
    }

    @GetMapping
    public ResponseEntity<List<Promotion>> getAllPromotions() {
        List<Promotion> promotions = promotionService.getAllPromotions();
        return new ResponseEntity<>(promotions, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Promotion> getPromotionById(@PathVariable Integer id) {
        Optional<Promotion> promotion = promotionService.getPromotionById(id);
        return promotion.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<Promotion> getPromotionByCode(@PathVariable String code) {
        Optional<Promotion> promotion = promotionService.getPromotionByCode(code);
        return promotion.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Promotion>> getActivePromotions() {
        List<Promotion> promotions = promotionService.getActivePromotions();
        return new ResponseEntity<>(promotions, HttpStatus.OK);
    }

    @GetMapping("/active-on-date")
    public ResponseEntity<List<Promotion>> getActivePromotionsOnDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date date) {
        
        List<Promotion> promotions = promotionService.getActivePromotionsOnDate(date);
        return new ResponseEntity<>(promotions, HttpStatus.OK);
    }

    @GetMapping("/current")
    public ResponseEntity<List<Promotion>> getCurrentPromotions() {
        List<Promotion> promotions = promotionService.getCurrentPromotions();
        return new ResponseEntity<>(promotions, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Promotion> createPromotion(@RequestBody Promotion promotion) {
        Promotion savedPromotion = promotionService.savePromotion(promotion);
        return new ResponseEntity<>(savedPromotion, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Promotion> updatePromotion(@PathVariable Integer id, @RequestBody Promotion promotion) {
        Optional<Promotion> existingPromotion = promotionService.getPromotionById(id);
        if (existingPromotion.isPresent()) {
            promotion.setIdPromotion(id);
            Promotion updatedPromotion = promotionService.savePromotion(promotion);
            return new ResponseEntity<>(updatedPromotion, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Promotion> updatePromotionStatus(
            @PathVariable Integer id, 
            @RequestParam boolean isActive) {
        
        Promotion updatedPromotion = promotionService.updatePromotionStatus(id, isActive);
        if (updatedPromotion != null) {
            return new ResponseEntity<>(updatedPromotion, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePromotion(@PathVariable Integer id) {
        Optional<Promotion> promotion = promotionService.getPromotionById(id);
        if (promotion.isPresent()) {
            promotionService.deletePromotion(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @GetMapping("/validate/{code}")
    public ResponseEntity<Map<String, Object>> validatePromotionCode(@PathVariable String code) {
        boolean isValid = promotionService.isPromotionValid(code);
        Map<String, Object> response = new HashMap<>();
        response.put("code", code);
        response.put("valid", isValid);
        
        if (isValid) {
            Optional<Promotion> promotion = promotionService.getPromotionByCode(code);
            promotion.ifPresent(p -> response.put("promotion", p));
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(response, HttpStatus.OK);
        }
    }
} 