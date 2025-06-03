package com.t2kcoffee.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {
    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints for customer (GET)
                .requestMatchers(HttpMethod.GET, "/api/products/**", "/api/categories/**", "/api/promotions/**", "/api/tables/**", "/api/variants/**", "/api/accounts/*/reward-points").permitAll()
                // Public endpoints for customer (POST/PUT)
                .requestMatchers(HttpMethod.POST, "/api/orders/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/orders/**").permitAll()
                .requestMatchers(HttpMethod.PATCH, "/api/tables/**").permitAll()
                // Customer: GET/POST cho payments, reward-points, login, register
                .requestMatchers(HttpMethod.GET, "/api/payments/**").hasAnyAuthority("CUSTOMER", "STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/payments/**", "/api/accounts/*/reward-points", "/api/accounts/login", "/api/accounts", "/api/accounts/register").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/accounts/*/reward-points").permitAll()
                // Cho phép ADMIN truy cập tất cả các endpoint dashboard
                .requestMatchers("/api/dashboard/**").hasAuthority("ADMIN")
                .requestMatchers("/api/system/**").hasAuthority("ADMIN")
                // Staff: GET/POST/PUT cho các API cho phép - đặt trước quy tắc ADMIN
                .requestMatchers(HttpMethod.GET, "/api/**").hasAnyAuthority("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/**").hasAnyAuthority("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/**").hasAnyAuthority("STAFF", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasAuthority("ADMIN")
                // Admin: full quyền cho các request còn lại
                .requestMatchers("/api/**").hasAuthority("ADMIN")
                // Các request còn lại phải xác thực
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:8080"));
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
} 