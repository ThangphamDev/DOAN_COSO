package com.t2kcoffee.service;

import com.t2kcoffee.entity.Account;
import com.t2kcoffee.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public AccountService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
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

    public boolean authenticate(String username, String password) {
        Optional<Account> accountOpt = accountRepository.findByUserName(username);
        
        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            return passwordEncoder.matches(password, account.getPassWord());
            }
        
            return false;
    }

    @Transactional
    public Account saveAccount(Account account) {
        if (account.getPassWord() != null && !account.getPassWord().startsWith("$2a$")) {
            account.setPassWord(passwordEncoder.encode(account.getPassWord()));
        }
        return accountRepository.save(account);
    }

    @Transactional
    public Account updateAccount(Integer id, Account accountDetails) {
        Optional<Account> account = accountRepository.findById(id);
        if (account.isPresent()) {
            Account existingAccount = account.get();
            existingAccount.setUserName(accountDetails.getUserName());
            existingAccount.setFullName(accountDetails.getFullName());
            
            if (accountDetails.getPassWord() != null && !accountDetails.getPassWord().isEmpty()) {
                if (!accountDetails.getPassWord().startsWith("$2a$")) {
                    existingAccount.setPassWord(passwordEncoder.encode(accountDetails.getPassWord()));
                } else {
                    existingAccount.setPassWord(accountDetails.getPassWord());
                }
            }
            
            existingAccount.setPhone(accountDetails.getPhone());
            existingAccount.setAddress(accountDetails.getAddress());
            existingAccount.setRole(accountDetails.getRole());
            
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
            if (password != null && !password.isEmpty()) {
                if (!password.startsWith("$2a$")) {
                    account.setPassWord(passwordEncoder.encode(password));
                } else {
                    account.setPassWord(password);
                }
            }
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

    @Transactional
    public void addRewardPoints(Integer accountId, Integer points) {
        if (points <= 0) {
            return;
        }
        
        Optional<Account> accountOpt = getAccountById(accountId);
        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            Integer currentPoints = account.getRewardPoints() != null ? account.getRewardPoints() : 0;
            account.setRewardPoints(currentPoints + points);
            accountRepository.save(account);
        }
    }
    
    @Transactional
    public void updateRewardPoints(Integer accountId, Integer newPoints) {
        if (newPoints < 0) {
            newPoints = 0;
        }
        
        Optional<Account> accountOpt = getAccountById(accountId);
        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            account.setRewardPoints(newPoints);
            accountRepository.save(account);
        }
    }
    
    public Integer getRewardPoints(Integer accountId) {
        Optional<Account> accountOpt = getAccountById(accountId);
        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            return account.getRewardPoints() != null ? account.getRewardPoints() : 0;
        }
        return 0;
    }
}