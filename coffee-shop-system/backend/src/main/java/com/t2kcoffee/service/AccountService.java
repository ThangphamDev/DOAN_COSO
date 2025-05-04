package com.t2kcoffee.service;

import com.t2kcoffee.model.Account;
import com.t2kcoffee.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    private final AccountRepository accountRepository;

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
            return password.equals(account.getPassWord());
        }
        
        return false;
    }

    @Transactional
    public Account saveAccount(Account account) {
        return accountRepository.save(account);
    }

    @Transactional
    public Account updateAccount(Integer id, Account accountDetails) {
        Optional<Account> account = accountRepository.findById(id);
        if (account.isPresent()) {
            Account existingAccount = account.get();
            existingAccount.setUserName(accountDetails.getUserName());
            existingAccount.setFullName(accountDetails.getFullName());
            
            // Only update password if provided
            if (accountDetails.getPassWord() != null && !accountDetails.getPassWord().isEmpty()) {
                existingAccount.setPassWord(accountDetails.getPassWord());
            }
            
            existingAccount.setPhone(accountDetails.getPhone());
            existingAccount.setAddress(accountDetails.getAddress());
            existingAccount.setRole(accountDetails.getRole());
            
            // Only update image if provided
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
                                         String role, MultipartFile imageFile) throws IOException {
        
        Optional<Account> accountOpt = accountRepository.findById(id);
        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            
            if (userName != null) account.setUserName(userName);
            if (fullName != null) account.setFullName(fullName);
            if (password != null && !password.isEmpty()) account.setPassWord(password);
            if (phone != null) account.setPhone(phone);
            if (address != null) account.setAddress(address);
            if (role != null) account.setRole(role);
            
            if (imageFile != null && !imageFile.isEmpty()) {
                account.setImage(imageFile.getBytes());
            }
            
            return accountRepository.save(account);
        }
        return null;
    }

    @Transactional
    public void deleteAccount(Integer id) {
        accountRepository.deleteById(id);
    }
}
