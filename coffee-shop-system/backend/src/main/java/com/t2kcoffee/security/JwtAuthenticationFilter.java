package com.t2kcoffee.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Bỏ qua xử lý token cho OPTIONS request (CORS preflight)
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                logger.info("Skipping JWT filter for OPTIONS request: " + request.getRequestURI());
                response.setStatus(HttpServletResponse.SC_OK);
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
                response.setHeader("Access-Control-Allow-Headers", "*");
                response.setHeader("Access-Control-Max-Age", "3600");
                filterChain.doFilter(request, response);
                return;
            }
            
            // Bật debug cho tất cả các yêu cầu
            String path = request.getRequestURI();
            String method = request.getMethod();
            logger.info("Processing " + method + " request to " + path);
            
            // Kiểm tra Authorization header
            String authHeader = request.getHeader("Authorization");
            logger.info("Authorization header: " + (authHeader != null ? authHeader.substring(0, Math.min(30, authHeader.length())) + "..." : "not present"));
            
            // Kiểm tra có token trong request header không
            String jwt = getJwtFromRequest(request);
            if (jwt != null) {
                logger.info("JWT Token present, length: " + jwt.length());
            } else {
                logger.info("JWT Token not present");
            }

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                // Lấy thông tin Authentication từ token
                Authentication authentication = tokenProvider.getAuthentication(jwt);
                
                // Log thông tin role từ token
                if (authentication != null && authentication.getAuthorities() != null) {
                    logger.info("User authorities: " + authentication.getAuthorities());
                }
                
                // Đặt thông tin Authentication vào SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);
                logger.info("Set Authentication to security context for user: " + 
                            (authentication != null ? authentication.getName() : "unknown"));
            } else if (StringUtils.hasText(jwt)) {
                logger.warn("Invalid JWT token: " + jwt.substring(0, Math.min(20, jwt.length())) + "...");
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
} 