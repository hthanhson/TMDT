package com.example.tmdt.config;

import com.example.tmdt.model.Role;
import com.example.tmdt.model.Role.ERole;
import com.example.tmdt.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        // Initialize roles if they don't exist
        if (roleRepository.count() == 0) {
            Role userRole = new Role(ERole.ROLE_USER);
            Role modRole = new Role(ERole.ROLE_MODERATOR);
            Role adminRole = new Role(ERole.ROLE_ADMIN);
            Role shipperRole = new Role(ERole.ROLE_SHIPPER);

            roleRepository.save(userRole);
            roleRepository.save(modRole);
            roleRepository.save(adminRole);
            roleRepository.save(shipperRole);
            log.info("Roles initialized successfully");
        }
    }
} 