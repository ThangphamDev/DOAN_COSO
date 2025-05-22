package com.t2k.coffee.service;

import com.t2k.coffee.entity.CafeTable;
import com.t2k.coffee.repository.CafeTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CafeTableService {
    @Autowired
    private CafeTableRepository cafeTableRepository;

    public List<CafeTable> getAllTables() {
        return cafeTableRepository.findAll();
    }

    public Optional<CafeTable> getTableById(Integer id) {
        return cafeTableRepository.findById(id);
    }

    public List<CafeTable> getTablesByStatus(String status) {
        return cafeTableRepository.findByStatus(status);
    }

    public List<CafeTable> getTablesByLocation(String location) {
        return cafeTableRepository.findByLocation(location);
    }

    public CafeTable createTable(CafeTable table) {
        return cafeTableRepository.save(table);
    }

    public CafeTable updateTable(Integer id, CafeTable table) {
        if (!cafeTableRepository.existsById(id)) {
            throw new RuntimeException("Table not found");
        }
        table.setId(id);
        return cafeTableRepository.save(table);
    }

    public void deleteTable(Integer id) {
        cafeTableRepository.deleteById(id);
    }

    public CafeTable updateTableStatus(Integer id, String status) {
        CafeTable table = cafeTableRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Table not found"));
        table.setStatus(status);
        return cafeTableRepository.save(table);
    }
} 