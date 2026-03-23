package com.t2kcoffee.controller;

import com.t2kcoffee.entity.Account;
import com.t2kcoffee.service.AccountService;
import com.t2kcoffee.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "*")
public class AccountController {

    private final AccountService accountService;
    private final JwtUtil jwtUtil;

    @Autowired
    public AccountController(AccountService accountService, JwtUtil jwtUtil) {
        this.accountService = accountService;
        this.jwtUtil = jwtUtil;
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
            @RequestParam("userName") String userName,
            @RequestParam("fullName") String fullName,
            @RequestParam("passWord") String passWord,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String address,
            @RequestParam("role") String role,
            @RequestParam(required = false) String image) {
        try {
            Account account = new Account();
            account.setUserName(userName);
            account.setFullName(fullName);
            account.setPassWord(passWord);
            account.setPhone(phone);
            account.setAddress(address);
            account.setRole(role);
            if (image != null && !image.isEmpty()) {
                account.setImage(image);
            }
            Account savedAccount = accountService.saveAccount(account);
            return new ResponseEntity<>(savedAccount, HttpStatus.CREATED);
        } catch (Exception e) {
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
            @RequestParam(required = false) String image) {
        try {
            Account updatedAccount = accountService.updateAccountWithImage(
                    id, userName, fullName, passWord, phone, address, role, image);
            if (updatedAccount != null) {
                return new ResponseEntity<>(updatedAccount, HttpStatus.OK);
            } else {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
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

    @GetMapping("/{id}/reward-points")
    public ResponseEntity<Map<String, Object>> getRewardPoints(@PathVariable Integer id) {
        Integer points = accountService.getRewardPoints(id);
        Map<String, Object> response = new HashMap<>();
        response.put("accountId", id);
        response.put("rewardPoints", points);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}/reward-points/add")
    public ResponseEntity<Map<String, Object>> addRewardPoints(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> pointsData) {
        
        Integer pointsToAdd = pointsData.get("points");
        if (pointsToAdd == null || pointsToAdd <= 0) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        accountService.addRewardPoints(id, pointsToAdd);
        
        // Lấy số điểm mới sau khi cập nhật
        Integer updatedPoints = accountService.getRewardPoints(id);
        
        Map<String, Object> response = new HashMap<>();
        response.put("accountId", id);
        response.put("pointsAdded", pointsToAdd);
        response.put("totalPoints", updatedPoints);
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
    
    @PutMapping("/{id}/reward-points")
    public ResponseEntity<Map<String, Object>> updateRewardPoints(
            @PathVariable Integer id,
            @RequestBody Map<String, Integer> pointsData) {
        
        Integer newPoints = pointsData.get("points");
        if (newPoints == null || newPoints < 0) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        
        accountService.updateRewardPoints(id, newPoints);
        
        Map<String, Object> response = new HashMap<>();
        response.put("accountId", id);
        response.put("rewardPoints", newPoints);
        
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("userName");
            String password = credentials.get("passWord");
            if (username == null || password == null) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Username and password are required (key phải là 'userName' và 'passWord')");
                return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
            }
            boolean isAuthenticated = accountService.authenticate(username, password);
            if (isAuthenticated) {
                Optional<Account> accountOpt = accountService.getAccountByUsername(username);
                if (accountOpt.isPresent()) {
                    Account account = accountOpt.get();
                    Map<String, Object> response = new HashMap<>();
                    String roleUpperCase = account.getRole() != null ? account.getRole().toUpperCase() : "UNKNOWN";
                    String jwt = jwtUtil.generateToken(username, roleUpperCase, account.getId());
                    response.put("token", jwt);
                    response.put("role", roleUpperCase);
                    response.put("userId", account.getId());
                    response.put("fullName", account.getFullName());
                    return new ResponseEntity<>(response, HttpStatus.OK);
                }
            }
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid username or password");
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi ra console
            Map<String, String> response = new HashMap<>();
            response.put("message", "Internal server error: " + e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{id}/avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable Integer id, @RequestParam("avatar") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded");
        }
        try {
            // Lưu file avatar và lấy tên file
            String fileName = accountService.storeAvatarFile(file, id);
            String avatarPath = "/uploads/images/avatar/" + fileName;
            accountService.updateAvatarPath(id, avatarPath);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("avatar", avatarPath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed: " + e.getMessage());
        }
    }
}
