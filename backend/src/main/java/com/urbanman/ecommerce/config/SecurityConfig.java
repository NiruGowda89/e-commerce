package com.urbanman.ecommerce.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Autowired
    public SecurityConfig(JwtAuthenticationFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // ── Public ──────────────────────────────────────────────────
                .requestMatchers("/api/auth/**").permitAll()

                // ── Products (Public read, Admin / Super-Admin modify) ───────
                .requestMatchers(HttpMethod.GET,    "/api/products/**").permitAll()
                .requestMatchers(HttpMethod.POST,   "/api/products/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/products/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                // ── Coupons (Admin & Super-Admin) ────────────────────────────
                .requestMatchers("/api/coupons/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                // ── Orders ──────────────────────────────────────────────────
                .requestMatchers("/api/order/place").authenticated()
                .requestMatchers("/api/order/all").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/api/order/**").authenticated()

                // ── Reviews ─────────────────────────────────────────────────
                .requestMatchers(HttpMethod.DELETE, "/api/reviews/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                // ── Super-Admin exclusive ────────────────────────────────────
                // Manage all admins and users (activate / deactivate accounts)
                .requestMatchers("/api/admin/users/**").hasRole("SUPER_ADMIN")
                // System analytics and reports
                .requestMatchers("/api/admin/analytics/**").hasRole("SUPER_ADMIN")
                // Full platform controls (role assignments, system settings)
                .requestMatchers("/api/admin/system/**").hasRole("SUPER_ADMIN")
                // General admin dashboard still accessible to both
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                // ── Allow static files and public pages ──────────────────────
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        return http.build();
    }
}
