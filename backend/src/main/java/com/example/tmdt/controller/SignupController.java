package com.example.tmdt.controller;

import java.util.HashSet;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;

import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.tmdt.model.Role;
import com.example.tmdt.model.User;
import com.example.tmdt.payload.request.SignupRequest;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.repository.RoleRepository;
import com.example.tmdt.repository.UserRepository;
import com.example.tmdt.utils.LoggerUtil;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/auth")
public class SignupController {
    private static final Logger logger = LoggerUtil.getLogger(SignupController.class);

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest, HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String clientIp = request.getRemoteAddr();
        String method = request.getMethod();
        
        logger.info("Registration attempt received - URI: {}, Method: {}, IP: {}", requestUri, method, clientIp);
        logger.info("Request headers: {}", getRequestHeaders(request));
        logger.info("Attempting to register new user: {}", signUpRequest.getUsername());
        logger.debug("Signup request data: username={}, email={}, fullName={}, address={}, phoneNumber={}, hasRoles={}",
                signUpRequest.getUsername(),
                signUpRequest.getEmail(),
                signUpRequest.getFullName(),
                signUpRequest.getAddress(),
                signUpRequest.getPhoneNumber(),
                signUpRequest.getRoles() != null);
        
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            logger.warn("Registration failed - Username already taken: {}", signUpRequest.getUsername());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            logger.warn("Registration failed - Email already in use: {}", signUpRequest.getEmail());
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        try {
            logger.debug("Creating new user with data: username={}, email={}, fullName={}", 
                    signUpRequest.getUsername(), signUpRequest.getEmail(), signUpRequest.getFullName());
            
            User user = new User(signUpRequest.getUsername(),
                    signUpRequest.getEmail(),
                    encoder.encode(signUpRequest.getPassword()),
                    signUpRequest.getFullName());
            logger.debug("Created new user object with username: {}", signUpRequest.getUsername());

            user.setPhoneNumber(signUpRequest.getPhoneNumber());
            user.setAddress(signUpRequest.getAddress());

            Set<String> strRoles = signUpRequest.getRoles();
            Set<Role> roles = new HashSet<>();

            if (strRoles == null) {
                logger.debug("No roles specified, searching for default ROLE_USER");
                Role userRole = roleRepository.findByName(Role.ERole.ROLE_USER)
                        .orElseThrow(() -> {
                            logger.error("ROLE_USER not found in database");
                            return new RuntimeException("Error: Role is not found.");
                        });
                roles.add(userRole);
                logger.debug("Default ROLE_USER assigned");
            } else {
                logger.debug("Processing roles: {}", strRoles);
                strRoles.forEach(role -> {
                    switch (role) {
                        case "admin":
                            logger.debug("Searching for ROLE_ADMIN");
                            Role adminRole = roleRepository.findByName(Role.ERole.ROLE_ADMIN)
                                    .orElseThrow(() -> {
                                        logger.error("ROLE_ADMIN not found in database");
                                        return new RuntimeException("Error: Role is not found.");
                                    });
                            roles.add(adminRole);
                            logger.debug("ROLE_ADMIN assigned");
                            break;
                        case "mod":
                            logger.debug("Searching for ROLE_MODERATOR");
                            Role modRole = roleRepository.findByName(Role.ERole.ROLE_MODERATOR)
                                    .orElseThrow(() -> {
                                        logger.error("ROLE_MODERATOR not found in database");
                                        return new RuntimeException("Error: Role is not found.");
                                    });
                            roles.add(modRole);
                            logger.debug("ROLE_MODERATOR assigned");
                            break;
                        default:
                            logger.debug("Invalid role '{}', searching for default ROLE_USER", role);
                            Role userRole = roleRepository.findByName(Role.ERole.ROLE_USER)
                                    .orElseThrow(() -> {
                                        logger.error("ROLE_USER not found in database");
                                        return new RuntimeException("Error: Role is not found.");
                                    });
                            roles.add(userRole);
                            logger.debug("Default ROLE_USER assigned");
                    }
                });
                logger.debug("Assigned roles to user: {}", roles);
            }

            user.setRoles(roles);
            logger.debug("Saving user to database");
            userRepository.save(user);
            logger.info("Successfully registered new user: {}", signUpRequest.getUsername());

            return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
        } catch (Exception e) {
            logger.error("Registration failed at line {} in class {}: {}", 
                    e.getStackTrace()[0].getLineNumber(),
                    e.getStackTrace()[0].getClassName(),
                    e.getMessage());
            logger.error("Registration exception: ", e);
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Error: Registration failed - " + e.getMessage()));
        }
    }
    
    private String getRequestHeaders(HttpServletRequest request) {
        StringBuilder headers = new StringBuilder();
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            // Bỏ qua các header nhạy cảm
            if (!"authorization".equalsIgnoreCase(name) && 
                !"cookie".equalsIgnoreCase(name)) {
                headers.append(name).append("=").append(request.getHeader(name)).append(", ");
            }
        }
        
        return headers.toString();
    }
} 