package com.t2kcoffee.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        String username = null;
        String jwt = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                // Token không hợp lệ
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(jwt, username)) {
                String rolesString = jwtUtil.extractRole(jwt);
                Integer userId = jwtUtil.extractUserId(jwt);
                
                // Parse multiple roles (comma-separated)
                String[] roles = rolesString != null ? rolesString.split(",") : new String[0];
                var authorities = new java.util.ArrayList<org.springframework.security.core.GrantedAuthority>();
                for (String role : roles) {
                    String trimmedRole = role.trim();
                    if (!trimmedRole.isEmpty()) {
                        // Backward compatibility: convert old "Staff" to "STAFF_MANAGER"
                        final String finalRole = "Staff".equalsIgnoreCase(trimmedRole) ? "STAFF_MANAGER" : trimmedRole;
                        authorities.add(() -> finalRole.toUpperCase());
                    }
                }
                
                User userDetails = new User(username, "", authorities);
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
} 