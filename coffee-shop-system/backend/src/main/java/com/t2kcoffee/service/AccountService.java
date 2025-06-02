package com.t2kcoffee.service;

import com.t2kcoffee.entity.Account;
import com.t2kcoffee.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Autowired
    public AccountService(AccountRepository accountRepository, 
                         PasswordEncoder passwordEncoder,
                         AuthenticationManager authenticationManager) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Optional<Account> getAccountById(Integer id) {
        return accountRepository.findById(id);
    }

    public Optional<Account> getAccountByUsername(String username) {
        return accountRepository.findByUserName(username);
    }

    public Authentication authenticate(String username, String password) throws AuthenticationException {
        return authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(username, password)
        );
    }

    @Transactional
    public Account saveAccount(Account account) {
        // Mã hóa mật khẩu trước khi lưu
        account.setPassWord(passwordEncoder.encode(account.getPassWord()));
        return accountRepository.save(account);
    }
    
    @Transactional
    public Account registerUser(Account account) {
        // Kiểm tra xem username đã tồn tại chưa
        if (accountRepository.findByUserName(account.getUserName()).isPresent()) {
            throw new RuntimeException("Username is already taken!");
        }
        
        // Đặt role mặc định là USER nếu không được chỉ định
        if (account.getRole() == null || account.getRole().isEmpty()) {
            account.setRole("USER");
        }
        
        // Mã hóa mật khẩu và lưu account
        account.setPassWord(passwordEncoder.encode(account.getPassWord()));
        return accountRepository.save(account);
    }

    @Transactional
    public Account updateAccount(Integer id, Account accountDetails) {
        Optional<Account> account = accountRepository.findById(id);
        if (account.isPresent()) {
            Account existingAccount = account.get();
            existingAccount.setUserName(accountDetails.getUserName());
            existingAccount.setFullName(accountDetails.getFullName());
            
            // Chỉ cập nhật mật khẩu nếu được cung cấp và mã hóa trước khi lưu
            if (accountDetails.getPassWord() != null && !accountDetails.getPassWord().isEmpty()) {
                existingAccount.setPassWord(passwordEncoder.encode(accountDetails.getPassWord()));
            }
            
            existingAccount.setPhone(accountDetails.getPhone());
            existingAccount.setAddress(accountDetails.getAddress());
            existingAccount.setRole(accountDetails.getRole());
            
            // Chỉ cập nhật ảnh nếu được cung cấp
            if (accountDetails.getImage() != null) {
                existingAccount.setImage(accountDetails.getImage());
            }
            
            return accountRepository.save(existingAccount);
        }
        return null;
    }

    @Transactional
    public Account updateAccountWithImage(Integer id, String userName, String fullName, 
                                         String password, String phone, String address, 
                                         String role, String avatarPath) {
        Optional<Account> accountOpt = accountRepository.findById(id);
        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            if (userName != null) account.setUserName(userName);
            if (fullName != null) account.setFullName(fullName);
            if (password != null && !password.isEmpty()) account.setPassWord(passwordEncoder.encode(password));
            if (phone != null) account.setPhone(phone);
            if (address != null) account.setAddress(address);
            if (role != null) account.setRole(role);
            if (avatarPath != null) account.setImage(avatarPath);
            return accountRepository.save(account);
        }
        return null;
    }

    @Transactional
    public void deleteAccount(Integer id) {
        accountRepository.deleteById(id);
    }

    @Transactional
    public void updateAvatarPath(Integer id, String avatarPath) {
        Optional<Account> accountOpt = getAccountById(id);
        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            account.setImage(avatarPath);
            accountRepository.save(account);
        }
    }

    @Transactional
    public String storeAvatarFile(MultipartFile file, Integer accountId) throws IOException {
        Path uploadPath = Paths.get(uploadDir, "avatar").toAbsolutePath().normalize();
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }
        String fileName = accountId + "_" + UUID.randomUUID().toString() + fileExtension;
        Path targetLocation = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation);
        return fileName;
    }
}
