package com.t2k.coffee.controller;

import com.t2k.coffee.entity.CafeTable;
import com.t2k.coffee.service.CafeTableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(origins = "*")
public class CafeTableController {
    @Autowired
    private CafeTableService tableService;

    @GetMapping
    public List<CafeTable> getAllTables() {
        return tableService.getAllTables();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CafeTable> getTableById(@PathVariable Integer id) {
        return tableService.getTableById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<CafeTable> getTablesByStatus(@PathVariable String status) {
        return tableService.getTablesByStatus(status);
    }

    @GetMapping("/location/{location}")
    public List<CafeTable> getTablesByLocation(@PathVariable String location) {
        return tableService.getTablesByLocation(location);
    }

    @PostMapping
    public CafeTable createTable(@RequestBody CafeTable table) {
        return tableService.createTable(table);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CafeTable> updateTable(@PathVariable Integer id, @RequestBody CafeTable table) {
        try {
            CafeTable updatedTable = tableService.updateTable(id, table);
            return ResponseEntity.ok(updatedTable);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CafeTable> updateTableStatus(@PathVariable Integer id, @RequestParam String status) {
        try {
            CafeTable updatedTable = tableService.updateTableStatus(id, status);
            return ResponseEntity.ok(updatedTable);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable Integer id) {
        try {
            tableService.deleteTable(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
} 