package com.urbanman.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class Webconfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(@NonNull CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(
                                "https://e-commerce-1-ariz.onrender.com",
                                "https://e-commerce-j5s5.vercel.app",
                                "https://e-commerce-two-rouge-62.vercel.app",
                                "https://e-commerce-1ttw.vercel.app",
                                "http://localhost:3000",
                                "http://localhost:5500",
                                "http://127.0.0.1:5500",
                                "http://localhost:5501",
                                "http://127.0.0.1:5501"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
