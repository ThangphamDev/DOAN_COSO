package com.t2k.coffee.service;

import com.t2k.coffee.entity.Promotion;
import com.t2k.coffee.repository.PromotionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PromotionService {
    @Autowired
    private PromotionRepository promotionRepository;

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public Optional<Promotion> getPromotionById(Integer id) {
        return promotionRepository.findById(id);
    }

    public Promotion getPromotionByCode(String code) {
        return promotionRepository.findByCode(code);
    }

    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByIsActive(true);
    }

    public List<Promotion> getCurrentPromotions() {
        LocalDate now = LocalDate.now();
        return promotionRepository.findByStartDateLessThanEqualAndEndDateGreaterThanEqual(now, now);
    }

    public Promotion createPromotion(Promotion promotion) {
        validatePromotionDates(promotion);
        return promotionRepository.save(promotion);
    }

    public Promotion updatePromotion(Integer id, Promotion promotion) {
        if (!promotionRepository.existsById(id)) {
            throw new RuntimeException("Promotion not found");
        }
        validatePromotionDates(promotion);
        promotion.setId(id);
        return promotionRepository.save(promotion);
    }

    public void deletePromotion(Integer id) {
        promotionRepository.deleteById(id);
    }

    public Promotion updatePromotionStatus(Integer id, Boolean isActive) {
        Promotion promotion = promotionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Promotion not found"));
        promotion.setIsActive(isActive);
        return promotionRepository.save(promotion);
    }

    private void validatePromotionDates(Promotion promotion) {
        if (promotion.getStartDate().isAfter(promotion.getEndDate())) {
            throw new RuntimeException("Start date must be before end date");
        }
    }
} 