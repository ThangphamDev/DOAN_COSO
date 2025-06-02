package com.t2kcoffee.controller;

import com.t2kcoffee.entity.Account;
import com.t2kcoffee.security.JwtTokenProvider;
import com.t2kcoffee.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AccountController(AccountService accountService, JwtTokenProvider tokenProvider, PasswordEncoder passwordEncoder) {
        this.accountService = accountService;
        this.tokenProvider = tokenProvider;
        this.passwordEncoder = passwordEncoder;
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

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam(required = false) Integer userId) {
        // Lấy thông tin xác thực từ SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Biến để lưu username cần tìm
        String username = null;
        
        // Trường hợp 1: Lấy từ token trong SecurityContext
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getPrincipal().equals("anonymousUser")) {
            
            if (authentication.getPrincipal() instanceof UserDetails) {
                username = ((UserDetails) authentication.getPrincipal()).getUsername();
            } else {
                username = authentication.getName();
            }
        }
        
        // Trường hợp 2: Lấy từ userId được truyền vào
        if (username == null && userId != null) {
            Optional<Account> accountById = accountService.getAccountById(userId);
            if (accountById.isPresent()) {
                return createUserResponse(accountById.get());
            }
        }
        
        // Nếu có username từ token, tìm account theo username
        if (username != null) {
            Optional<Account> accountOpt = accountService.getAccountByUsername(username);
            if (accountOpt.isPresent()) {
                return createUserResponse(accountOpt.get());
            }
        }
        
        return new ResponseEntity<>("Không tìm thấy thông tin tài khoản", HttpStatus.NOT_FOUND);
    }

    // Phương thức hỗ trợ để tạo response từ Account
    private ResponseEntity<?> createUserResponse(Account account) {
        // Tạo đối tượng response với thông tin cần thiết
        Map<String, Object> response = new HashMap<>();
        response.put("id", account.getId());
        response.put("userName", account.getUserName());
        response.put("fullName", account.getFullName());
        response.put("role", account.getRole());
        response.put("phone", account.getPhone());
        response.put("address", account.getAddress());
        response.put("image", account.getImage());
        
        // Thêm điểm thưởng
        response.put("rewardPoints", account.getRewardPoints() != null ? account.getRewardPoints() : 0);
        
        return new ResponseEntity<>(response, HttpStatus.OK);
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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("userName");
        String password = credentials.get("passWord");
        
        if (username == null || password == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Username and password are required");
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }
        
        try {
            // Xác thực thông qua Spring Security
            Authentication authentication = accountService.authenticate(username, password);
            
            // Đặt thông tin xác thực vào SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Tạo token JWT
            String jwt = tokenProvider.generateToken(authentication);
            
            // Lấy thông tin người dùng
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            Optional<Account> accountOpt = accountService.getAccountByUsername(username);
            
            if (accountOpt.isPresent()) {
                Account account = accountOpt.get();
                Map<String, Object> response = new HashMap<>();
                response.put("token", jwt);
                
                // Chuyển role thành chữ hoa để đảm bảo tương thích với frontend
                String roleUpperCase = account.getRole() != null ? account.getRole().toUpperCase() : "UNKNOWN";
                
                response.put("role", roleUpperCase);
                response.put("userId", account.getId());
                response.put("fullName", account.getFullName());
                return new ResponseEntity<>(response, HttpStatus.OK);
            }
            
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (BadCredentialsException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Invalid username or password");
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Account account) {
        try {
            // Đăng ký tài khoản mới với role mặc định là USER
            Account registeredAccount = accountService.registerUser(account);
            
            // Tạo token JWT từ thông tin người dùng
            String jwt = tokenProvider.generateTokenFromUsernameAndRole(
                registeredAccount.getUserName(), 
                registeredAccount.getRole()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", jwt);
            response.put("role", registeredAccount.getRole().toUpperCase());
            response.put("userId", registeredAccount.getId());
            response.put("fullName", registeredAccount.getFullName());
            
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
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
