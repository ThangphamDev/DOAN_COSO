package com.t2kcoffee.service;

import com.t2kcoffee.entity.Promotion;
import com.t2kcoffee.repository.PromotionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class PromotionService {

    private final PromotionRepository promotionRepository;

    @Autowired
    public PromotionService(PromotionRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }
    
    public PromotionRepository getPromotionRepository() {
        return this.promotionRepository;
    }

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public Optional<Promotion> getPromotionById(Integer id) {
        return promotionRepository.findById(id);
    }

    public Optional<Promotion> getPromotionByCode(String code) {
        return promotionRepository.findByCode(code);
    }

    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByIsActiveTrue();
    }

    public List<Promotion> getActivePromotionsOnDate(Date date) {
        return promotionRepository.findActivePromotionsOnDate(date);
    }

    public List<Promotion> getCurrentPromotions() {
        return promotionRepository.findCurrentPromotions();
    }

    @Transactional
    public Promotion savePromotion(Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    @Transactional
    public Promotion updatePromotionStatus(Integer id, boolean isActive) {
        Optional<Promotion> promotionOpt = promotionRepository.findById(id);
        if (promotionOpt.isPresent()) {
            Promotion promotion = promotionOpt.get();
            promotion.setIsActive(isActive);
            return promotionRepository.save(promotion);
        }
        return null;
    }

    @Transactional
    public void deletePromotion(Integer id) {
        promotionRepository.deleteById(id);
    }

    // Validate if a promotion code is applicable
    public boolean isPromotionValid(String code) {
        Optional<Promotion> promotionOpt = promotionRepository.findByCode(code);
        if (promotionOpt.isPresent()) {
            Promotion promotion = promotionOpt.get();
            Date currentDate = new Date();
            return promotion.getIsActive() && 
                   !currentDate.before(promotion.getStartDate()) && 
                   !currentDate.after(promotion.getEndDate());
        }
        return false;
    }
    
    // Calculate discount amount for a given order total
    public BigDecimal calculateDiscount(String promoCode, BigDecimal orderTotal) {
        Optional<Promotion> promotionOpt = promotionRepository.findByCode(promoCode);
        
        if (!promotionOpt.isPresent() || !isPromotionValid(promoCode)) {
            return BigDecimal.ZERO;
        }
        
        Promotion promotion = promotionOpt.get();
        
        // Check minimum order amount if set
        if (promotion.getMinimumOrderAmount() != null && 
            orderTotal.compareTo(promotion.getMinimumOrderAmount()) < 0) {
            return BigDecimal.ZERO;
        }
        
        BigDecimal discountAmount;
        
        if ("PERCENT".equals(promotion.getDiscountType())) {
            // Calculate percent discount
            discountAmount = orderTotal.multiply(promotion.getDiscountValue().divide(new BigDecimal("100")));
            
            // Apply maximum discount if set
            if (promotion.getMaximumDiscount() != null && 
                discountAmount.compareTo(promotion.getMaximumDiscount()) > 0) {
                discountAmount = promotion.getMaximumDiscount();
            }
        } else {
            // Apply fixed discount
            discountAmount = promotion.getDiscountValue();
            
            // Ensure discount doesn't exceed order total
            if (discountAmount.compareTo(orderTotal) > 0) {
                discountAmount = orderTotal;
            }
        }
        
        return discountAmount;
    }
    
    // Get promotions based on order amount
    public List<Promotion> getApplicablePromotions(BigDecimal orderAmount) {
        Date currentDate = new Date();
        return promotionRepository.findApplicablePromotions(currentDate, orderAmount);
    }
} 