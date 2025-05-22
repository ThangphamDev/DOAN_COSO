package com.t2k.coffee.repository;

import com.t2k.coffee.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PromotionRepository extends JpaRepository<Promotion, Integer> {
    Promotion findByCode(String code);
    List<Promotion> findByIsActive(Boolean isActive);
    List<Promotion> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate date, LocalDate date2);
} 