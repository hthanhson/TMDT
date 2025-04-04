package com.example.tmdt.security.jwt;

import com.example.tmdt.utils.LoggerUtil;
import org.slf4j.Logger;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerUtil.getLogger(AuthEntryPointJwt.class);

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {
        logger.error("Unauthorized error at line {} in {}: {}", 
            authException.getStackTrace()[0].getLineNumber(),
            authException.getStackTrace()[0].getClassName(),
            authException.getMessage());
            
        logger.debug("Request details - URI: {}, Method: {}, IP: {}, Headers: {}", 
            request.getRequestURI(), 
            request.getMethod(),
            request.getRemoteAddr(),
            request.getHeaderNames());
        
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Error: Unauthorized");
    }
} 