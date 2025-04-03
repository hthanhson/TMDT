package com.example.tmdt.controller;

import com.example.tmdt.utils.LoggerUtil;
import org.slf4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/test")
public class TestController {
    private static final Logger logger = LoggerUtil.getLogger(TestController.class);

    @GetMapping("/hello")
    public ResponseEntity<?> hello() {
        logger.info("Test hello endpoint called");
        Map<String, String> response = new HashMap<>();
        response.put("message", "Hello from test endpoint!");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/echo")
    public ResponseEntity<?> echo(@RequestBody Map<String, Object> data) {
        logger.info("Test echo endpoint called with data: {}", data);
        return ResponseEntity.ok(data);
    }
} 