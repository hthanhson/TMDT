package com.example.tmdt.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.example.tmdt.payload.response.FileResponse;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.service.FileStorageService;
import org.springframework.core.io.FileSystemResource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.File;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<FileResponse> uploadFile(@RequestParam("file") MultipartFile file,
                                                  @RequestParam(value = "directory", required = false) String directory) {
        String fileName = fileStorageService.storeFile(file, directory != null ? directory : "");
        
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/")
                .path(fileName)
                .toUriString();
        
        FileResponse fileResponse = new FileResponse(
                fileName,
                fileDownloadUri,
                file.getContentType(),
                file.getSize());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(fileResponse);
    }
    
    @PostMapping("/upload/multiple")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<FileResponse>> uploadMultipleFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "directory", required = false) String directory) {
        
        List<FileResponse> responses = Arrays.stream(files)
                .map(file -> {
                    String fileName = fileStorageService.storeFile(file, directory != null ? directory : "");
                    String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/api/files/")
                            .path(fileName)
                            .toUriString();
                    
                    return new FileResponse(
                            fileName,
                            fileDownloadUri,
                            file.getContentType(),
                            file.getSize());
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.status(HttpStatus.CREATED).body(responses);
    }
    
    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        // Load file as Resource
        Resource resource = fileStorageService.loadFileAsResource(fileName);
        
        // Determine content type
        String contentType = null;
        try {
            contentType = MediaType.parseMediaType(
                    org.springframework.util.MimeTypeUtils.APPLICATION_OCTET_STREAM_VALUE).toString();
        } catch (Exception ex) {
            contentType = "application/octet-stream";
        }
        
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
    
    @DeleteMapping("/{fileName:.+}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deleteFile(@PathVariable String fileName) {
        try {
            fileStorageService.deleteFile(fileName);
            return ResponseEntity.ok(new MessageResponse("File deleted successfully: " + fileName));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Could not delete file: " + e.getMessage()));
        }
    }

    @GetMapping("/product-image/{filename:.+}")
    public ResponseEntity<Resource> getProductImage(@PathVariable String filename) {
        try {
            // Attempt to load from backend/uploads/products first
            Path filePath = Paths.get("backend/uploads/products/" + filename);
            if (!Files.exists(filePath)) {
                // Try uploads/products as fallback
                filePath = Paths.get("uploads/products/" + filename);
            }
            
            // Check if file exists
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            // Get file content type
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            // Create resource and return it
            Resource resource = new FileSystemResource(filePath.toFile());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(resource);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/check-image/{filename:.+}")
    public ResponseEntity<?> checkImage(@PathVariable String filename) {
        // Construct paths to check
        String backendPath = "backend/uploads/products/" + filename;
        String regularPath = "uploads/products/" + filename;
        
        // Check if files exist
        boolean backendExists = new File(backendPath).exists();
        boolean regularExists = new File(regularPath).exists();
        
        // Create response
        String response = "Backend path (" + backendPath + "): " + (backendExists ? "EXISTS" : "NOT FOUND") + 
                         "\nRegular path (" + regularPath + "): " + (regularExists ? "EXISTS" : "NOT FOUND");
        
        return ResponseEntity.ok(response);
    }
}