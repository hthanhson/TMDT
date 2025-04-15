package com.example.tmdt.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
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
        http.cors().and().csrf().disable()
            .exceptionHandling().authenticationEntryPoint(unauthorizedHandler).and()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS).and()
            .authorizeHttpRequests(authorize -> authorize
                .antMatchers("/api/auth/**").permitAll()
                .antMatchers("/auth/**").permitAll()
                .antMatchers("/api/signup/**").permitAll()
                .antMatchers("/signup/**").permitAll()
                .antMatchers("/api/notifications/**").permitAll()
                .antMatchers("/api/test/**").permitAll()
                .antMatchers("/products/**").permitAll()
                .antMatchers("/test/**").permitAll()
                .antMatchers("/api/products/**").permitAll()
                .antMatchers("/api/categories/**").permitAll()
                .antMatchers("/api/reviews/**").permitAll()
                .antMatchers("/api/files/**").permitAll()
                .antMatchers("/api/public/**").permitAll()
                .antMatchers("/api/chat/sessions/**").permitAll()
                .antMatchers("/api/chat/messages/**").permitAll()
                .antMatchers("/api-docs/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                .antMatchers("/ws/**").permitAll()
                .antMatchers("/chat/**").permitAll()
                .antMatchers("/topic/**").permitAll()
                .antMatchers("/app/**").permitAll()
                .antMatchers("/user/**").permitAll()
                .antMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );

        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
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