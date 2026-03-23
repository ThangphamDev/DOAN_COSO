package com.t2kcoffee.controller;

import com.t2kcoffee.entity.CafeTable;
import com.t2kcoffee.service.CafeTableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(origins = "*")
public class CafeTableController {

    private final CafeTableService cafeTableService;

    @Autowired
    public CafeTableController(CafeTableService cafeTableService) {
        this.cafeTableService = cafeTableService;
    }

    @GetMapping
    public ResponseEntity<List<CafeTable>> getAllTables() {
        List<CafeTable> tables = cafeTableService.getAllTables();
        return new ResponseEntity<>(tables, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CafeTable> getTableById(@PathVariable Integer id) {
        Optional<CafeTable> table = cafeTableService.getTableById(id);
        return table.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<CafeTable>> getTablesByStatus(@PathVariable String status) {
        List<CafeTable> tables = cafeTableService.getTablesByStatus(status);
        return new ResponseEntity<>(tables, HttpStatus.OK);
    }

    @GetMapping("/capacity")
    public ResponseEntity<List<CafeTable>> getTablesByMinCapacity(@RequestParam Integer minCapacity) {
        List<CafeTable> tables = cafeTableService.getTablesByMinCapacity(minCapacity);
        return new ResponseEntity<>(tables, HttpStatus.OK);
    }

    @GetMapping("/location/{location}")
    public ResponseEntity<List<CafeTable>> getTablesByLocation(@PathVariable String location) {
        List<CafeTable> tables = cafeTableService.getTablesByLocation(location);
        return new ResponseEntity<>(tables, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<CafeTable> createTable(@RequestBody CafeTable cafeTable) {
        CafeTable savedTable = cafeTableService.saveTable(cafeTable);
        return new ResponseEntity<>(savedTable, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CafeTable> updateTable(@PathVariable Integer id, @RequestBody CafeTable cafeTable) {
        Optional<CafeTable> existingTable = cafeTableService.getTableById(id);
        if (existingTable.isPresent()) {
            cafeTable.setIdTable(id);
            CafeTable updatedTable = cafeTableService.saveTable(cafeTable);
            return new ResponseEntity<>(updatedTable, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CafeTable> updateTableStatus(
            @PathVariable Integer id, 
            @RequestParam String status) {
        
        CafeTable updatedTable = cafeTableService.updateTableStatus(id, status);
        if (updatedTable != null) {
            return new ResponseEntity<>(updatedTable, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable Integer id) {
        Optional<CafeTable> table = cafeTableService.getTableById(id);
        if (table.isPresent()) {
            cafeTableService.deleteTable(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
} 