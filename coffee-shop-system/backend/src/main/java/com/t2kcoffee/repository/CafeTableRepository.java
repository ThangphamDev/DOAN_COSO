package com.t2kcoffee.repository;

import com.t2kcoffee.model.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CafeTableRepository extends JpaRepository<CafeTable, Integer> {
    List<CafeTable> findByStatus(String status);
    
    List<CafeTable> findByCapacityGreaterThanEqual(Integer minCapacity);
    
    List<CafeTable> findByLocation(String location);
} 