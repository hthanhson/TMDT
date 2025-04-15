package com.example.tmdt.security.jwt;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.example.tmdt.utils.LoggerUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerUtil.getLogger(AuthEntryPointJwt.class);

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException, ServletException {
        logger.error("Unauthorized error: {}", authException.getMessage());
        
        // Log detailed information about the request
        logger.error("Request URL: {}", request.getRequestURL());
        logger.error("Request URI: {}", request.getRequestURI());
        logger.error("Request Method: {}", request.getMethod());
        logger.error("Request Remote User: {}", request.getRemoteUser());
        logger.error("Request User Principal: {}", request.getUserPrincipal());
        
        // Log headers for debugging
        logger.error("Auth Header: {}", request.getHeader("Authorization"));
        
        // Check if this is a 403 Forbidden (vs 401 Unauthorized)
        boolean isForbidden = response.getStatus() == HttpServletResponse.SC_FORBIDDEN;
        if (isForbidden) {
            logger.error("Access forbidden (403): User is authenticated but lacks required role");
        } else {
            logger.error("Unauthorized (401): Authentication failed or not provided");
        }
        
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        final Map<String, Object> body = new HashMap<>();
        body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        body.put("error", "Unauthorized");
        body.put("message", authException.getMessage());
        body.put("path", request.getServletPath());

        final ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), body);
    }
} 