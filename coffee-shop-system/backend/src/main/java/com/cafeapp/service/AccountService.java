package com.cafeapp.service;

import com.cafeapp.model.Account;

import java.util.List;
import java.util.Optional;

public interface AccountService {
    
    List<Account> getAllAccounts();
    
    Optional<Account> getAccountById(Integer id);
    
    Optional<Account> getAccountByUsername(String username);
    
    Account saveAccount(Account account);
    
    void deleteAccount(Integer id);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    boolean authenticate(String username, String password);
} 