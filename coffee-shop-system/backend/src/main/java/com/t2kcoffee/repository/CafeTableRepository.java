package com.t2kcoffee.repository;

import com.t2kcoffee.entity.CafeTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CafeTableRepository extends JpaRepository<CafeTable, Integer> {
    List<CafeTable> findByStatus(String status);
    
    List<CafeTable> findByCapacityGreaterThanEqual(Integer minCapacity);
    
    List<CafeTable> findByLocation(String location);

    @Modifying
    @Query("UPDATE CafeTable t SET t.status = :status WHERE t.idTable = :id")
    void updateTableStatus(@Param("id") Integer id, @Param("status") String status);
} 