package com.t2kcoffee.service;

import com.t2kcoffee.entity.CafeTable;
import com.t2kcoffee.repository.CafeTableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CafeTableService {

    private final CafeTableRepository cafeTableRepository;

    @Autowired
    public CafeTableService(CafeTableRepository cafeTableRepository) {
        this.cafeTableRepository = cafeTableRepository;
    }

    public List<CafeTable> getAllTables() {
        return cafeTableRepository.findAll();
    }

    public Optional<CafeTable> getTableById(Integer id) {
        return cafeTableRepository.findById(id);
    }

    public List<CafeTable> getTablesByStatus(String status) {
        return cafeTableRepository.findByStatus(status);
    }

    public List<CafeTable> getTablesByMinCapacity(Integer minCapacity) {
        return cafeTableRepository.findByCapacityGreaterThanEqual(minCapacity);
    }

    public List<CafeTable> getTablesByLocation(String location) {
        return cafeTableRepository.findByLocation(location);
    }

    @Transactional
    public CafeTable saveTable(CafeTable cafeTable) {
        return cafeTableRepository.save(cafeTable);
    }

    @Transactional
    public CafeTable updateTableStatus(Integer id, String status) {
        Optional<CafeTable> tableOpt = cafeTableRepository.findById(id);
        if (tableOpt.isPresent()) {
            CafeTable table = tableOpt.get();
            table.setStatus(status);
            return cafeTableRepository.save(table);
        }
        return null;
    }

    @Transactional
    public void deleteTable(Integer id) {
        cafeTableRepository.deleteById(id);
    }
} 