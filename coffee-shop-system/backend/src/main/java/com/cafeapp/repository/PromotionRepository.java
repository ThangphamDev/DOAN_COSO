package com.cafeapp.repository;

import com.cafeapp.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Integer> {
    
    Optional<Promotion> findByName(String name);
    
    List<Promotion> findByIsActive(Boolean isActive);
    
    @Query("SELECT p FROM Promotion p WHERE p.isActive = true AND ?1 BETWEEN p.startDate AND p.endDate")
    List<Promotion> findActivePromotions(LocalDateTime currentDate);
    
    @Query("SELECT p FROM Promotion p WHERE p.isActive = true AND p.startDate <= ?1 AND p.endDate >= ?1")
    List<Promotion> findValidPromotions(LocalDateTime date);
    
    List<Promotion> findByStartDateAfter(LocalDateTime date);
    
    List<Promotion> findByEndDateBefore(LocalDateTime date);
} 