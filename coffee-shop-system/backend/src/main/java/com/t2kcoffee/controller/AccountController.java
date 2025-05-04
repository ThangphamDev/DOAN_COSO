package com.t2kcoffee.controller;

import com.t2kcoffee.model.Account;
import com.t2kcoffee.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountService accountService;

    @Autowired
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ResponseEntity<List<Account>> getAllAccounts() {
        List<Account> accounts = accountService.getAllAccounts();
        return new ResponseEntity<>(accounts, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccountById(@PathVariable Integer id) {
        Optional<Account> account = accountService.getAccountById(id);
        return account.map(value -> new ResponseEntity<>(value, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody Account account) {
        Account savedAccount = accountService.saveAccount(account);
        return new ResponseEntity<>(savedAccount, HttpStatus.CREATED);
    }

    @PostMapping("/with-image")
    public ResponseEntity<Account> createAccountWithImage(
            @RequestParam("image") MultipartFile file,
            @RequestParam("userName") String userName,
            @RequestParam("fullName") String fullName,
            @RequestParam("passWord") String passWord,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String address,
            @RequestParam("role") String role) {
        
        try {
            Account account = new Account();
            account.setUserName(userName);
            account.setFullName(fullName);
            account.setPassWord(passWord);
            account.setPhone(phone);
            account.setAddress(address);
            account.setRole(role);
            
            // Set image
            if (!file.isEmpty()) {
                account.setImage(file.getBytes());
            }
            
            Account savedAccount = accountService.saveAccount(account);
            return new ResponseEntity<>(savedAccount, HttpStatus.CREATED);
        } catch (IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> updateAccount(@PathVariable Integer id, @RequestBody Account account) {
        Account updatedAccount = accountService.updateAccount(id, account);
        if (updatedAccount != null) {
            return new ResponseEntity<>(updatedAccount, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/{id}/with-image")
    public ResponseEntity<Account> updateAccountWithImage(
            @PathVariable Integer id,
            @RequestParam(required = false) String userName,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String passWord,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) MultipartFile image) {
        
        try {
            Account updatedAccount = accountService.updateAccountWithImage(
                    id, userName, fullName, passWord, phone, address, role, image);
            
            if (updatedAccount != null) {
                return new ResponseEntity<>(updatedAccount, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (IOException e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Integer id) {
        Optional<Account> account = accountService.getAccountById(id);
        if (account.isPresent()) {
            accountService.deleteAccount(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("userName");
        String password = credentials.get("passWord");
        
        if (username == null || password == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Username and password are required");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
        
        boolean isAuthenticated = accountService.authenticate(username, password);
        
        if (isAuthenticated) {
            Optional<Account> accountOpt = accountService.getAccountByUsername(username);
            if (accountOpt.isPresent()) {
                Account account = accountOpt.get();
                Map<String, Object> response = new HashMap<>();
                response.put("token", "t2k-" + System.currentTimeMillis()); // Simple token generation
                
                // Chuyển role thành chữ hoa để đảm bảo tương thích với frontend
                String roleUpperCase = account.getRole() != null ? account.getRole().toUpperCase() : "UNKNOWN";
                
                response.put("role", roleUpperCase);
                response.put("userId", account.getId());
                response.put("fullName", account.getFullName());
                return new ResponseEntity<>(response, HttpStatus.OK);
            }
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Invalid username or password");
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }
}
