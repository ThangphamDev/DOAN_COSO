package com.cafeapp.repository;

import com.cafeapp.model.Table;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TableRepository extends JpaRepository<Table, Integer> {
    
    Optional<Table> findByTableNumber(Integer tableNumber);
    
    List<Table> findByIsAvailable(Boolean isAvailable);
    
    boolean existsByTableNumber(Integer tableNumber);
} 