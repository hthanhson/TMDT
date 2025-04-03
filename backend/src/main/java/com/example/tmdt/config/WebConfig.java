package com.example.tmdt.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // Loại bỏ phương pháp chuyển tiếp (forward) vì nó không chuyển tiếp request body đúng cách
    // Thay vào đó, sử dụng cấu hình trong controller với @RequestMapping({"/api/auth", "/auth"})
} 