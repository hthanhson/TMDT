package com.example.tmdt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Chỉ cho phép origin từ frontend
        config.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        
        // Cho phép các HTTP method cụ thể
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        
        // Cho phép các header cụ thể
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Auth-Token"));
        
        // Expose headers
        config.setExposedHeaders(Arrays.asList("X-Auth-Token"));
        
        // Cho phép credentials
        config.setAllowCredentials(true);
        
        // Cấu hình tối đa age cho preflight
        config.setMaxAge(3600L);
        
        // Áp dụng cấu hình cho mọi đường dẫn
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}