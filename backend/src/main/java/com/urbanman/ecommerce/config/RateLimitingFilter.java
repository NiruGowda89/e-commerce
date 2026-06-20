package com.urbanman.ecommerce.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(1) // Execute first in the filter chain
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int GLOBAL_LIMIT_PER_MINUTE = 100;
    private static final int AUTH_LIMIT_PER_MINUTE = 5;
    private static final long ONE_MINUTE_MS = 60_000;

    private final Map<String, List<Long>> globalLimitMap = new ConcurrentHashMap<>();
    private final Map<String, List<Long>> authLimitMap = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Only rate limit API requests
        if (path.startsWith("/api/")) {
            String ip = getClientIp(request);
            long now = System.currentTimeMillis();

            // 1. Enforce Auth Rate Limiting (Login/Register/Forgot)
            if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register") || path.startsWith("/api/auth/forgot-password")) {
                if (isLimitExceeded(ip, authLimitMap, AUTH_LIMIT_PER_MINUTE, now)) {
                    sendErrorResponse(response, "Too many authentication attempts. Please try again after a minute.");
                    return;
                }
            }

            // 2. Enforce Global API Throttling
            if (isLimitExceeded(ip, globalLimitMap, GLOBAL_LIMIT_PER_MINUTE, now)) {
                sendErrorResponse(response, "Too many requests. Throttling active. Please try again later.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isLimitExceeded(String ip, Map<String, List<Long>> limitMap, int limit, long now) {
        List<Long> timestamps = limitMap.computeIfAbsent(ip, k -> Collections.synchronizedList(new ArrayList<>()));
        synchronized (timestamps) {
            // Remove timestamps older than 1 minute
            timestamps.removeIf(time -> (now - time) > ONE_MINUTE_MS);

            if (timestamps.size() >= limit) {
                return true;
            }
            timestamps.add(now);
            return false;
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Take the first IP if forwarded through multiple proxies
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private void sendErrorResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429); // HTTP 429 Too Many Requests
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}
