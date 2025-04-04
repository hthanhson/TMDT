package com.example.tmdt.security.jwt;

import com.example.tmdt.security.services.UserDetailsServiceImpl;
import com.example.tmdt.utils.LoggerUtil;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerUtil.getLogger(AuthTokenFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Log request details
            logger.debug("Processing request to URL: {}, Method: {}", request.getRequestURI(), request.getMethod());
            
            String jwt = parseJwt(request);
            if (jwt != null) {
                logger.debug("Found JWT token in request: {}", jwt);
                
                if (jwtUtils.validateJwtToken(jwt)) {
                    String username = jwtUtils.getUserNameFromJwtToken(jwt);
                    logger.debug("Valid JWT token found for user: {}", username);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.debug("User details loaded for: {}, User class: {}", 
                        username, userDetails.getClass().getName());
                    logger.debug("User authorities: {}", userDetails.getAuthorities());
                    
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Set authentication for user: {} with authorities: {}", 
                        username, userDetails.getAuthorities());
                    
                    // Log current authentication after setting it
                    if (SecurityContextHolder.getContext().getAuthentication() != null) {
                        logger.debug("Authentication set in SecurityContext: {}, Principal class: {}", 
                            SecurityContextHolder.getContext().getAuthentication(),
                            SecurityContextHolder.getContext().getAuthentication().getPrincipal().getClass().getName());
                    } else {
                        logger.error("Failed to set authentication in SecurityContext");
                    }
                } else {
                    logger.error("Invalid JWT token: {}", jwt);
                }
            } else {
                logger.debug("No JWT token found in request to: {}", request.getRequestURI());
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication at line {} in {}: {}", 
                e.getStackTrace()[0].getLineNumber(),
                e.getStackTrace()[0].getClassName(),
                e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        logger.debug("Authorization header: {}", headerAuth);

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            logger.debug("Found Authorization header with Bearer token");
            return headerAuth.substring(7);
        }

        logger.debug("No Authorization header found in request");
        return null;
    }
} 