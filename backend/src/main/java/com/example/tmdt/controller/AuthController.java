package com.example.tmdt.controller;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.HashSet;

import javax.validation.Valid;

import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.tmdt.payload.request.LoginRequest;
import com.example.tmdt.payload.request.SignupRequest;
import com.example.tmdt.payload.response.JwtResponse;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.repository.RoleRepository;
import com.example.tmdt.repository.UserRepository;
import com.example.tmdt.security.jwt.JwtUtils;
import com.example.tmdt.security.services.UserDetailsImpl;
import com.example.tmdt.utils.LoggerUtil;
import com.example.tmdt.model.User;
import com.example.tmdt.model.Role;
import com.example.tmdt.model.ERole;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/auth")
public class AuthController {
    private static final Logger logger = LoggerUtil.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("Attempting to authenticate user: {}", loginRequest.getUsername());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));
            logger.debug("Authentication successful for user: {}", loginRequest.getUsername());

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);
            logger.debug("JWT token generated successfully");

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());
            
            // Xác định vai trò chính của người dùng để điều hướng frontend
            String primaryRole = determinePrimaryRole(roles);

            logger.info("User {} successfully authenticated with roles: {}", loginRequest.getUsername(), roles);
            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getEmail(),
                    userDetails.getFullName(),
                    roles,
                    primaryRole));
        } catch (Exception e) {
            logger.error("Authentication failed for user: {} - Error: {}", loginRequest.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid username or password"));
        }
    }

    // Xác định vai trò chính của người dùng để chuyển hướng sau khi đăng nhập
    private String determinePrimaryRole(List<String> roles) {
        // Ưu tiên theo thứ tự: ADMIN > SHIPPER > MODERATOR > USER
        if (roles.contains("ROLE_ADMIN")) {
            return "ROLE_ADMIN";
        } else if (roles.contains("ROLE_SHIPPER")) {
            return "ROLE_SHIPPER";
        } else if (roles.contains("ROLE_MODERATOR")) {
            return "ROLE_MODERATOR";
        } else {
            return "ROLE_USER";
        }
    }

    @PostMapping("/signup/shipper")
    public ResponseEntity<?> registerShipper(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFullName(signUpRequest.getFullName());
        user.setAddress(signUpRequest.getAddress());
        user.setPhoneNumber(signUpRequest.getPhoneNumber());

        Set<Role> roles = new HashSet<>();

        // Always assign ROLE_SHIPPER
        Role shipperRole = roleRepository.findByName(Role.ERole.ROLE_SHIPPER)
                .orElseThrow(() -> new RuntimeException("Error: Shipper Role is not found."));
        roles.add(shipperRole);

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Shipper registered successfully!"));
    }
} 