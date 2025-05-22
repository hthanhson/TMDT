package com.example.tmdt.controller;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Autowired;
import com.example.tmdt.repository.ProductRepository;
import com.example.tmdt.model.Product;
import java.util.Optional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.HttpHeaders;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/images")
public class ImageController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/products/{filename:.+}")
    public ResponseEntity<Resource> getProductImage(@PathVariable String filename) {
        try {
            System.out.println("Image requested: " + filename);
            
            // Build path to image
            Path filePath = Paths.get("backend/uploads/products/" + filename);
            File file = filePath.toFile();
            
            // Check if file exists
            if (!file.exists()) {
                System.err.println("Image file not found: " + filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
            
            // Get content type
            String contentType;
            try {
                contentType = Files.probeContentType(filePath);
            } catch (Exception e) {
                contentType = "image/jpeg"; // Default to image/jpeg
            }
            
            System.out.println("Serving image: " + filePath.toAbsolutePath() + " as " + contentType);
            
            // Return the resource
            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
            
        } catch (Exception e) {
            System.err.println("Error serving image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/test/products")
    public ResponseEntity<?> testProductImages() {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Check if directory exists
            Path dirPath = Paths.get("backend/uploads/products");
            File dir = dirPath.toFile();
            
            response.put("directoryExists", dir.exists());
            response.put("directoryPath", dirPath.toAbsolutePath().toString());
            
            if (dir.exists()) {
                // List all files in directory
                File[] files = dir.listFiles();
                List<Map<String, Object>> fileList = Arrays.stream(files != null ? files : new File[0])
                    .map(file -> {
                        Map<String, Object> fileInfo = new HashMap<>();
                        fileInfo.put("name", file.getName());
                        fileInfo.put("size", file.length());
                        fileInfo.put("isFile", file.isFile());
                        fileInfo.put("lastModified", file.lastModified());
                        return fileInfo;
                    })
                    .collect(Collectors.toList());
                    
                response.put("files", fileList);
                response.put("fileCount", fileList.size());
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/debug/product/{id}")
    public ResponseEntity<?> debugProductImage(@PathVariable Long id) {
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Find the product
            Optional<Product> productOpt = productRepository.findById(id);
            if (!productOpt.isPresent()) {
                response.put("error", "Product not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            Product product = productOpt.get();
            response.put("id", product.getId());
            response.put("name", product.getName());
            response.put("imageUrl", product.getImageUrl());
            
            // Check if the image URL is valid
            if (product.getImageUrl() != null && !product.getImageUrl().isEmpty()) {
                String imageUrl = product.getImageUrl();
                response.put("hasImageUrl", true);
                response.put("imageUrlValue", imageUrl);
                
                // If it starts with /uploads/products, check if file exists
                if (imageUrl.startsWith("/uploads/products/")) {
                    String filename = imageUrl.substring("/uploads/products/".length());
                    Path filePath = Paths.get("backend/uploads/products/" + filename);
                    File file = filePath.toFile();
                    
                    response.put("filename", filename);
                    response.put("filePath", filePath.toString());
                    response.put("fileExists", file.exists());
                    response.put("fileAbsolutePath", file.getAbsolutePath());
                    
                    if (file.exists()) {
                        response.put("fileSize", file.length());
                        response.put("fileLastModified", file.lastModified());
                    }
                }
            } else {
                response.put("hasImageUrl", false);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/direct/{filename:.+}")
    public ResponseEntity<Resource> getProductImageWithCors(@PathVariable String filename) {
        try {
            System.out.println("Direct image access requested: " + filename);
            
            // Build path to image
            Path filePath = Paths.get("backend/uploads/products/" + filename);
            File file = filePath.toFile();
            
            // Check if file exists
            if (!file.exists()) {
                System.err.println("Direct image file not found: " + filePath.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
            
            // Get content type
            String contentType;
            try {
                contentType = Files.probeContentType(filePath);
            } catch (Exception e) {
                contentType = "image/jpeg"; // Default to image/jpeg
            }
            
            System.out.println("Serving direct image: " + filePath.toAbsolutePath() + " as " + contentType);
            
            // Create headers with CORS support
            HttpHeaders headers = new HttpHeaders();
            headers.add("Access-Control-Allow-Origin", "*");
            headers.add("Access-Control-Allow-Methods", "GET, OPTIONS");
            headers.add("Access-Control-Allow-Headers", "*");
            headers.add("Access-Control-Max-Age", "3600");
            
            // Return the resource with CORS headers
            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .headers(headers)
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);
            
        } catch (Exception e) {
            System.err.println("Error serving direct image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
} 