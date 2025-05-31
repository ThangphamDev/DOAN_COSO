package com.t2kcoffee.security;

import com.t2kcoffee.security.jwt.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("securityService")
public class SecurityService {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public boolean isCurrentUser(Integer userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        String currentUserIdStr = jwtTokenProvider.getClaimFromToken(authentication.getCredentials().toString(), "userId");
        
        if (currentUserIdStr == null) {
            return false;
        }

        try {
            Integer currentUserId = Integer.parseInt(currentUserIdStr);
            return userId.equals(currentUserId);
        } catch (NumberFormatException e) {
            return false;
        }
    }
} 