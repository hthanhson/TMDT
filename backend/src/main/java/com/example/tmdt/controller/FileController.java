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

@RestController
@RequestMapping("/files")
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
}