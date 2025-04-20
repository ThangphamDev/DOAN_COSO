package com.cafeapp.service.impl;

import com.cafeapp.model.Account;
import com.cafeapp.repository.AccountRepository;
import com.cafeapp.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AccountServiceImpl implements AccountService {
    
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Autowired
    public AccountServiceImpl(AccountRepository accountRepository, PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Override
    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }
    
    @Override
    public Optional<Account> getAccountById(Integer id) {
        return accountRepository.findById(id);
    }
    
    @Override
    public Optional<Account> getAccountByUsername(String username) {
        return accountRepository.findByUsername(username);
    }
    
    @Override
    public Account saveAccount(Account account) {
        // Encode password before saving
        if (account.getId() == null || 
            (accountRepository.findById(account.getId())
                .map(existing -> !existing.getPassword().equals(account.getPassword()))
                .orElse(true))) {
            account.setPassword(passwordEncoder.encode(account.getPassword()));
        }
        return accountRepository.save(account);
    }
    
    @Override
    public void deleteAccount(Integer id) {
        accountRepository.deleteById(id);
    }
    
    @Override
    public boolean existsByUsername(String username) {
        return accountRepository.existsByUsername(username);
    }
    
    @Override
    public boolean existsByEmail(String email) {
        return accountRepository.existsByEmail(email);
    }
    
    @Override
    public boolean authenticate(String username, String password) {
        Optional<Account> accountOpt = accountRepository.findByUsername(username);
        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            return passwordEncoder.matches(password, account.getPassword()) && account.getIsActive();
        }
        return false;
    }
} 