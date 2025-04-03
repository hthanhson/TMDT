package com.example.tmdt.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller demo để test logging
 */
@RestController
@RequestMapping("/logging-demo")
public class LoggingDemoController {

    private static final Logger logger = LoggerFactory.getLogger(LoggingDemoController.class);

    /**
     * Endpoint demo normal logging
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getInfo() {
        logger.trace("This is a TRACE message");
        logger.debug("This is a DEBUG message");
        logger.info("This is an INFO message");
        logger.warn("This is a WARN message");
        logger.error("This is an ERROR message");

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Logging demo - check console and log files");
        response.put("status", "success");
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint demo exception logging
     */
    @GetMapping("/error")
    public ResponseEntity<Map<String, Object>> triggerError() {
        logger.info("About to trigger an exception for logging demo");
        try {
            // Cố tình gây ra exception
            String nullStr = null;
            nullStr.length(); // Sẽ gây ra NullPointerException
            return ResponseEntity.ok(new HashMap<>());
        } catch (Exception e) {
            logger.error("Exception occurred in error endpoint", e);
            throw e;
        }
    }

    /**
     * Endpoint demo tham số path variable
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        logger.info("Fetching user with ID: {}", id);

        Map<String, Object> user = new HashMap<>();
        user.put("id", id);
        user.put("name", "User " + id);
        user.put("email", "user" + id + "@example.com");

        return ResponseEntity.ok(user);
    }
} 