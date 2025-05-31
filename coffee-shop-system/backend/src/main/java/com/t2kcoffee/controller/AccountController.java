package com.t2kcoffee.controller;

import com.t2kcoffee.entity.Account;
import com.t2kcoffee.service.AccountService;
import com.t2kcoffee.security.jwt.JwtTokenProvider;
import com.t2kcoffee.security.ratelimit.RateLimitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final JwtTokenProvider jwtTokenProvider;
    private final RateLimitService rateLimitService;

    @Value("${app.jwt.header}")
    private String tokenHeader;

    @Value("${app.jwt.prefix}")
    private String tokenPrefix;

    @Autowired
    public AccountController(AccountService accountService, 
                           JwtTokenProvider jwtTokenProvider,
                           RateLimitService rateLimitService) {
        this.accountService = accountService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.rateLimitService = rateLimitService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Account>> getAllAccounts() {
        try {
            List<Account> accounts = accountService.getAllAccounts();
            return ResponseEntity.ok(accounts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id)")
    public ResponseEntity<?> getAccountById(@PathVariable Integer id) {
        try {
            Optional<Account> account = accountService.getAccountById(id);
            if (account.isPresent()) {
                return ResponseEntity.ok(account.get());
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Account not found"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving account"));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createAccount(@RequestBody Account account) {
        try {
            // Validate required fields
            if (account.getUserName() == null || account.getUserName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
            }
            if (account.getPassWord() == null || account.getPassWord().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
            }
            if (account.getRole() == null || account.getRole().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Role is required"));
            }

            Account savedAccount = accountService.saveAccount(account);
            return new ResponseEntity<>(savedAccount, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error creating account"));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id)")
    public ResponseEntity<?> updateAccount(@PathVariable Integer id, @RequestBody Account account) {
        try {
            Account updatedAccount = accountService.updateAccount(id, account);
            if (updatedAccount != null) {
                return ResponseEntity.ok(updatedAccount);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Account not found"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating account"));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAccount(@PathVariable Integer id) {
        try {
            Optional<Account> account = accountService.getAccountById(id);
            if (account.isPresent()) {
                accountService.deleteAccount(id);
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Account not found"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting account"));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("userName");
            
            if (username == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Username is required"));
            }

            // Check rate limit using username as key
            if (!rateLimitService.tryConsume(username)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of("message", "Too many login attempts. Please try again later."));
            }

            String password = credentials.get("passWord");
            if (password == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Password is required"));
            }
            
            Map<String, String> tokens = accountService.authenticate(username, password);
            if (tokens == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid username or password"));
            }

            Optional<Account> accountOpt = accountService.getAccountByUsername(username);
            if (!accountOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("message", "Error retrieving account details"));
            }

            Account account = accountOpt.get();
            Map<String, Object> response = new HashMap<>();
            response.put("accessToken", tokens.get("accessToken"));
            response.put("refreshToken", tokens.get("refreshToken"));
            response.put("role", account.getRole().toUpperCase());
            response.put("userId", account.getId());
            response.put("fullName", account.getFullName());

            HttpHeaders headers = new HttpHeaders();
            headers.add(tokenHeader, tokenPrefix + " " + tokens.get("accessToken"));
            
            return new ResponseEntity<>(response, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error during login: " + e.getMessage()));
        }
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestHeader(value = "${app.jwt.header}") String header) {
        try {
            String refreshToken = jwtTokenProvider.getTokenFromHeader(header);
            if (refreshToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "No token provided"));
            }

            if (!jwtTokenProvider.validateToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid or expired refresh token"));
            }

            String username = jwtTokenProvider.getUsernameFromToken(refreshToken);
            String newAccessToken = jwtTokenProvider.generateToken(username);
            
            Map<String, String> response = new HashMap<>();
            response.put("accessToken", newAccessToken);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(tokenHeader, tokenPrefix + " " + newAccessToken);
            
            return new ResponseEntity<>(response, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error refreshing token: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/avatar")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id)")
    public ResponseEntity<?> uploadAvatar(@PathVariable Integer id, @RequestParam("avatar") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "No file uploaded"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Only image files are allowed"));
            }

            // Check if account exists
            Optional<Account> accountOpt = accountService.getAccountById(id);
            if (!accountOpt.isPresent()) {
                return ResponseEntity.notFound()
                        .build();
            }

            String fileName = accountService.storeAvatarFile(file, id);
            String avatarPath = "/uploads/images/avatar/" + fileName;
            accountService.updateAvatarPath(id, avatarPath);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "avatar", avatarPath
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Error uploading file: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error processing avatar upload: " + e.getMessage()));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "${app.jwt.header}") String header) {
        try {
            String token = jwtTokenProvider.getTokenFromHeader(header);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "No token provided"));
            }

            if (!jwtTokenProvider.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid or expired token"));
            }

            String username = jwtTokenProvider.getUsernameFromToken(token);
            Optional<Account> account = accountService.getAccountByUsername(username);
            if (!account.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not found"));
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error validating token: " + e.getMessage()));
        }
    }
}
