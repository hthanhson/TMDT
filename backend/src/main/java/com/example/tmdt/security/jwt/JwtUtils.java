package com.example.tmdt.security.jwt;

import com.example.tmdt.security.services.UserDetailsImpl;
import com.example.tmdt.utils.LoggerUtil;
import io.jsonwebtoken.*;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerUtil.getLogger(JwtUtils.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expirationMs}")
    private int jwtExpirationMs;

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        logger.debug("Generating JWT token for user: {}", userPrincipal.getUsername());

        String token = Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
                
        logger.debug("Generated JWT token: {}", token);
        return token;
    }

    public String getUserNameFromJwtToken(String token) {
        try {
            String username = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).getBody().getSubject();
            logger.debug("Extracted username from JWT token: {}", username);
            return username;
        } catch (Exception e) {
            logger.error("Error extracting username from JWT token at line {} in {}: {}", 
                e.getStackTrace()[0].getLineNumber(),
                e.getStackTrace()[0].getClassName(),
                e.getMessage());
            return null;
        }
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
            logger.debug("JWT token validation successful");
            return true;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature at line {} in {}: {}", 
                e.getStackTrace()[0].getLineNumber(),
                e.getStackTrace()[0].getClassName(),
                e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token at line {} in {}: {}", 
                e.getStackTrace()[0].getLineNumber(),
                e.getStackTrace()[0].getClassName(),
                e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired at line {} in {}: {}", 
                e.getStackTrace()[0].getLineNumber(),
                e.getStackTrace()[0].getClassName(),
                e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported at line {} in {}: {}", 
                e.getStackTrace()[0].getLineNumber(),
                e.getStackTrace()[0].getClassName(),
                e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty at line {} in {}: {}", 
                e.getStackTrace()[0].getLineNumber(),
                e.getStackTrace()[0].getClassName(),
                e.getMessage());
        }

        return false;
    }
} 