package com.t2k.coffee.repository;

import com.t2k.coffee.entity.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CafeTableRepository extends JpaRepository<CafeTable, Integer> {
    List<CafeTable> findByStatus(String status);
    List<CafeTable> findByLocation(String location);
} 