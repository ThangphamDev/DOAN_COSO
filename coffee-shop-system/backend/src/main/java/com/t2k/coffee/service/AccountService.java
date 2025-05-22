package com.t2k.coffee.service;

import com.t2k.coffee.entity.Account;
import com.t2k.coffee.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {
    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    public Optional<Account> getAccountById(Integer id) {
        return accountRepository.findById(id);
    }

    public Account createAccount(Account account) {
        if (accountRepository.existsByUsername(account.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        account.setPassword(passwordEncoder.encode(account.getPassword()));
        return accountRepository.save(account);
    }

    public Account updateAccount(Integer id, Account account) {
        if (!accountRepository.existsById(id)) {
            throw new RuntimeException("Account not found");
        }
        account.setId(id);
        return accountRepository.save(account);
    }

    public void deleteAccount(Integer id) {
        accountRepository.deleteById(id);
    }

    public Optional<Account> findByUsername(String username) {
        return accountRepository.findByUsername(username);
    }
} 