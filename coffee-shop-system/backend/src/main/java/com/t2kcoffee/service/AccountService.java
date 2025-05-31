package com.t2kcoffee.service;

import com.t2kcoffee.entity.Account;
import com.t2kcoffee.repository.AccountRepository;
import com.t2kcoffee.security.jwt.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Service
public class AccountService implements UserDetailsService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AuthenticationManager authenticationManager;

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Optional<Account> getAccountById(Integer id) {
        return accountRepository.findById(id);
    }

    public Optional<Account> getAccountByUsername(String username) {
        return accountRepository.findByUserName(username);
    }

    public Account saveAccount(Account account) {
        validateAccount(account);
        if (account.getId() == null) {
            account.setPassWord(passwordEncoder.encode(account.getPassWord()));
        }
        return accountRepository.save(account);
    }

    public Account updateAccount(Integer id, Account account) {
        return accountRepository.findById(id)
                .map(existingAccount -> {
                    validateAccount(account);
                    existingAccount.setUserName(account.getUserName());
                    existingAccount.setFullName(account.getFullName());
                    if (account.getPassWord() != null && !account.getPassWord().isEmpty()) {
                        existingAccount.setPassWord(passwordEncoder.encode(account.getPassWord()));
                    }
                    existingAccount.setPhone(account.getPhone());
                    existingAccount.setAddress(account.getAddress());
                    existingAccount.setRole(account.getRole());
                    if (account.getImage() != null) {
                        existingAccount.setImage(account.getImage());
                    }
                    return accountRepository.save(existingAccount);
                })
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + id));
    }

    public void deleteAccount(Integer id) {
        accountRepository.deleteById(id);
    }

    public Map<String, String> authenticate(String username, String password) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        String accessToken = jwtTokenProvider.generateToken(username);
        String refreshToken = jwtTokenProvider.generateRefreshToken(username);

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken);

        return tokens;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accountRepository.findByUserName(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + account.getRole().toUpperCase()));

        return new User(account.getUserName(), account.getPassWord(), authorities);
    }

    private void validateAccount(Account account) {
        if (account.getUserName() == null || account.getUserName().trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (account.getId() == null && (account.getPassWord() == null || account.getPassWord().length() < 6)) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }
        if (account.getRole() == null || account.getRole().trim().isEmpty()) {
            throw new IllegalArgumentException("Role is required");
        }
    }

    public String storeAvatarFile(MultipartFile file, Integer accountId) throws IOException {
        String uploadDir = "uploads/images/avatar";
        Path uploadPath = Paths.get(uploadDir);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String fileExtension = getFileExtension(file.getOriginalFilename());
        String fileName = "avatar_" + accountId + "_" + UUID.randomUUID().toString() + fileExtension;
        
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        return fileName;
    }

    private String getFileExtension(String fileName) {
        return fileName.substring(fileName.lastIndexOf("."));
    }

    public void updateAvatarPath(Integer accountId, String avatarPath) {
        accountRepository.findById(accountId).ifPresent(account -> {
            account.setImage(avatarPath);
            accountRepository.save(account);
        });
    }
}
