package com.example.tmdt.config;

import com.example.tmdt.model.Role;
import com.example.tmdt.model.Role.ERole;
import com.example.tmdt.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Initialize roles if they don't exist
        if (roleRepository.count() == 0) {
            Role userRole = new Role(ERole.ROLE_USER);
            Role modRole = new Role(ERole.ROLE_MODERATOR);
            Role adminRole = new Role(ERole.ROLE_ADMIN);

            roleRepository.save(userRole);
            roleRepository.save(modRole);
            roleRepository.save(adminRole);

            System.out.println("Roles initialized successfully!");
        }
    }
} 