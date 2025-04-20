package com.cafeapp.controller;

import com.cafeapp.model.Account;
import com.cafeapp.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    private final AccountService accountService;
    
    @Autowired
    public AuthController(AccountService accountService) {
        this.accountService = accountService;
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");
        
        if (username == null || password == null) {
            return new ResponseEntity<>("Tên đăng nhập và mật khẩu không được để trống", HttpStatus.BAD_REQUEST);
        }
        
        if (accountService.authenticate(username, password)) {
            Optional<Account> accountOpt = accountService.getAccountByUsername(username);
            Account account = accountOpt.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", account.getId());
            response.put("username", account.getUsername());
            response.put("fullName", account.getFullName());
            response.put("email", account.getEmail());
            response.put("role", account.getRole());
            
            return new ResponseEntity<>(response, HttpStatus.OK);
        } else {
            return new ResponseEntity<>("Tên đăng nhập hoặc mật khẩu không đúng", HttpStatus.UNAUTHORIZED);
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Account account) {
        // Kiểm tra tên đăng nhập đã tồn tại
        if (accountService.existsByUsername(account.getUsername())) {
            return new ResponseEntity<>("Tên đăng nhập đã tồn tại", HttpStatus.BAD_REQUEST);
        }
        
        // Kiểm tra email đã tồn tại
        if (account.getEmail() != null && accountService.existsByEmail(account.getEmail())) {
            return new ResponseEntity<>("Email đã tồn tại", HttpStatus.BAD_REQUEST);
        }
        
        // Đặt quyền mặc định nếu không có
        if (account.getRole() == null) {
            account.setRole("USER");
        }
        
        // Đặt trạng thái mặc định là active
        account.setIsActive(true);
        
        Account savedAccount = accountService.saveAccount(account);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedAccount.getId());
        response.put("username", savedAccount.getUsername());
        response.put("message", "Đăng ký tài khoản thành công");
        
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // Trong thực tế, có thể xử lý thêm logic logout nếu sử dụng JWT
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đăng xuất thành công");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
} 