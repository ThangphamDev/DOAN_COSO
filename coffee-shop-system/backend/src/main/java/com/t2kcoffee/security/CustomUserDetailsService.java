package com.t2kcoffee.security;

import com.t2kcoffee.entity.Account;
import com.t2kcoffee.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final AccountRepository accountRepository;

    @Autowired
    public CustomUserDetailsService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accountRepository.findByUserName(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));

        // Đảm bảo role không null
        String role = account.getRole();
        if (role == null || role.trim().isEmpty()) {
            role = "USER";
        }
        
        // Chuẩn hóa role để có định dạng ROLE_XXX cho Spring Security
        String roleWithPrefix = !role.startsWith("ROLE_") 
            ? "ROLE_" + role.toUpperCase()
            : role.toUpperCase();
        
        return new User(
                account.getUserName(),
                account.getPassWord(),  // BCrypt PasswordEncoder sẽ xác nhận mật khẩu mã hóa
                Collections.singletonList(new SimpleGrantedAuthority(roleWithPrefix))
        );
    }
} 