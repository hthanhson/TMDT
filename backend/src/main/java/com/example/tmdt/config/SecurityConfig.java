package com.example.tmdt.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.core.convert.converter.Converter;

import com.example.tmdt.security.jwt.AuthEntryPointJwt;
import com.example.tmdt.security.jwt.AuthTokenFilter;
import com.example.tmdt.security.services.UserDetailsServiceImpl;
import com.example.tmdt.security.services.UserDetailsImpl;
import com.example.tmdt.repository.UserRepository;
import com.example.tmdt.model.User;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;
    
    @Autowired
    private UserRepository userRepository;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public Converter<Authentication, User> authenticationUserConverter() {
        return new Converter<Authentication, User>() {
            @Override
            public User convert(Authentication authentication) {
                if (authentication == null) {
                    return null;
                }
                
                Object principal = authentication.getPrincipal();
                if (principal instanceof UserDetailsImpl) {
                    UserDetailsImpl userDetails = (UserDetailsImpl) principal;
                    return userRepository.findById(userDetails.getId()).orElse(null);
                }
                
                return null;
            }
        };
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().configurationSource(corsConfigurationSource()).and()
            .csrf().disable()
            .exceptionHandling().authenticationEntryPoint(unauthorizedHandler).and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
            .authorizeHttpRequests(authorize -> authorize
                // Common public endpoints
                .antMatchers("/api/auth/**", "/auth/**").permitAll()
                .antMatchers("/api/signup/**", "/signup/**").permitAll()
                .antMatchers("/api/test/**", "/test/**").permitAll()
                // Product related endpoints
                .antMatchers("/api/products/**", "/products/**").permitAll()
                .antMatchers("/products/top").permitAll()
                .antMatchers("/products/recommended").permitAll()
                // Category related endpoints
                .antMatchers("/api/categories/**").permitAll()
                // Other public endpoints
                .antMatchers("/api/reviews/**").permitAll()
                .antMatchers("/api/files/**").permitAll()
                .antMatchers("/api/public/**").permitAll()
                .antMatchers("/actuator/health").permitAll()
                .antMatchers("/api/notifications/**").permitAll()
                // Chat related endpoints
                .antMatchers("/api/chat/sessions/**").permitAll()
                .antMatchers("/api/chat/messages/**").permitAll()
                .antMatchers("/ws/**").permitAll()
                .antMatchers("/chat/**").permitAll()
                .antMatchers("/topic/**").permitAll()
                .antMatchers("/app/**").permitAll()
                .antMatchers("/user/**").permitAll()
                // Swagger/API docs
                .antMatchers("/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                // Role specific endpoints
                .antMatchers("/api/shipper/**").hasRole("SHIPPER")
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                .antMatchers("/uploads/refunds/**").permitAll()
                .antMatchers("/orders/**").permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Combine both CORS configurations
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:3001"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Auth-Token", "*"));
        configuration.setExposedHeaders(Arrays.asList("X-Auth-Token"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}