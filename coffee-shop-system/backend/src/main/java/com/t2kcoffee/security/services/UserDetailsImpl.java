package com.t2kcoffee.security.services;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@AllArgsConstructor
@Getter
public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private Integer idAccount;
    private String userName;
    private String fullName;
    @JsonIgnore
    private String passWord;
    private String role;
    private String status;
    private Collection<? extends GrantedAuthority> authorities;

    public static UserDetailsImpl build(com.t2kcoffee.entity.Account account) {
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(account.getRole()));

        return new UserDetailsImpl(
                account.getIDAccount(),
                account.getUserName(),
                account.getFullName(),
                account.getPassWord(),
                account.getRole(),
                account.getStatus(),
                authorities);
    }

    @Override
    public String getPassword() {
        return passWord;
    }

    @Override
    public String getUsername() {
        return userName;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return "active".equals(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "active".equals(status);
    }
} 