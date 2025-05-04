package com.t2kcoffee.repository;

import com.t2kcoffee.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {
    List<Promotion> findByIsActiveTrue();
    
    Optional<Promotion> findByCode(String code);
    
    @Query("SELECT p FROM Promotion p WHERE p.startDate <= ?1 AND p.endDate >= ?1 AND p.isActive = true")
    List<Promotion> findActivePromotionsOnDate(Date date);
    
    @Query("SELECT p FROM Promotion p WHERE p.endDate >= CURRENT_DATE AND p.isActive = true")
    List<Promotion> findCurrentPromotions();
} 