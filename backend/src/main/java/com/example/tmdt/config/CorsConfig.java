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
        
        // Cho phép các origin khác nhau
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "http://localhost:3001"
            // Thêm các origin khác nếu cần
        ));
        
        // Cho phép các header
        config.setAllowedHeaders(Arrays.asList(
            "Origin", 
            "Content-Type", 
            "Accept", 
            "Authorization",
            "Access-Control-Allow-Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers",
            "Access-Control-Allow-Credentials"
        ));
        
        // Cho phép các phương thức
        config.setAllowedMethods(Arrays.asList(
            "GET", 
            "POST", 
            "PUT", 
            "DELETE", 
            "OPTIONS"
        ));
        
        // Cho phép sử dụng cookie
        config.setAllowCredentials(true);
        
        // Thời gian cache của preflight requests
        config.setMaxAge(3600L);
        
        // Áp dụng cấu hình cho tất cả endpoints
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}