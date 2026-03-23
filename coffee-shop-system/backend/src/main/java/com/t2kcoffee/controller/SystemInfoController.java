package com.t2kcoffee.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "*")
public class SystemInfoController {
    
    private final JdbcTemplate jdbcTemplate;
    
    @Autowired
    public SystemInfoController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> systemInfo = new HashMap<>();
        
        // Thông tin cơ bản về hệ thống
        systemInfo.put("appName", "T2K Coffee Shop");
        systemInfo.put("version", "1.0.0");
        systemInfo.put("serverTime", new java.util.Date().toString());
        
        // Kiểm tra kết nối database
        boolean dbConnected = false;
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            dbConnected = (result != null && result == 1);
        } catch (Exception e) {
            // Không làm gì nếu không thể kết nối
        }
        systemInfo.put("databaseConnected", dbConnected);
        
        return ResponseEntity.ok(systemInfo);
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());
        
        // Kiểm tra kết nối database
        Map<String, Object> database = new HashMap<>();
        try {
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            database.put("status", (result != null && result == 1) ? "UP" : "DOWN");
        } catch (Exception e) {
            database.put("status", "DOWN");
            database.put("error", e.getMessage());
        }
        health.put("database", database);
        
        // Thêm thông tin về runtime
        Map<String, Object> runtime = new HashMap<>();
        runtime.put("processors", Runtime.getRuntime().availableProcessors());
        runtime.put("freeMemory", Runtime.getRuntime().freeMemory());
        runtime.put("totalMemory", Runtime.getRuntime().totalMemory());
        runtime.put("maxMemory", Runtime.getRuntime().maxMemory());
        health.put("runtime", runtime);
        
        return ResponseEntity.ok(health);
    }
} 