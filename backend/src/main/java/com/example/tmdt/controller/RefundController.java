package com.example.tmdt.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.tmdt.model.RefundRequest;
import com.example.tmdt.model.User;
import com.example.tmdt.model.RefundRequest.RefundStatus;
import com.example.tmdt.payload.request.RefundRequestDto;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.service.RefundService;
import com.example.tmdt.service.UserService;

import javax.validation.Valid;

@RestController
@RequestMapping("/refunds")
public class RefundController {
    
    @Autowired
    private RefundService refundService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Create a new refund request
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createRefundRequest(
            @RequestPart("data") @Valid RefundRequestDto requestDto,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            RefundRequest refundRequest = refundService.createRefundRequest(user, requestDto, images);
            return ResponseEntity.status(HttpStatus.CREATED).body(refundRequest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Failed to create refund request: " + e.getMessage()));
        }
    }
    
    /**
     * Get refund request by order ID
     */
    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getRefundRequestByOrderId(@PathVariable Long orderId) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            // Check if user has access to this order
            Optional<RefundRequest> refundRequestOpt = refundService.getRefundRequestByOrderId(orderId);
            
            if (refundRequestOpt.isPresent()) {
                RefundRequest refundRequest = refundRequestOpt.get();
                
                // Check if the user is the owner of the order or an admin
                boolean isAdmin = auth.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                
                if (refundRequest.getOrder().getUserId().equals(user.getId()) || isAdmin) {
                    return ResponseEntity.ok(refundRequest);
                } else {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(new MessageResponse("You don't have permission to view this refund request"));
                }
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving refund request: " + e.getMessage()));
        }
    }
    
    /**
     * Get all refund requests for current user
     */
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getMyRefundRequests() {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            List<RefundRequest> refundRequests = refundService.getRefundRequestsByUser(user);
            return ResponseEntity.ok(refundRequests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving refund requests: " + e.getMessage()));
        }
    }
    
    /**
     * Admin endpoint to get all refund requests
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllRefundRequests() {
        try {
            List<RefundRequest> refundRequests = refundService.getAllRefundRequests();
            return ResponseEntity.ok(refundRequests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving refund requests: " + e.getMessage()));
        }
    }
    
    /**
     * Admin endpoint to get refund requests by status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getRefundRequestsByStatus(@PathVariable String status) {
        try {
            RefundStatus refundStatus = RefundStatus.valueOf(status.toUpperCase());
            List<RefundRequest> refundRequests = refundService.getRefundRequestsByStatus(refundStatus);
            return ResponseEntity.ok(refundRequests);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid status value: " + status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving refund requests: " + e.getMessage()));
        }
    }
    
    /**
     * Admin endpoint to update refund request status
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRefundRequestStatus(
            @PathVariable Long id,
            @RequestParam("status") String status,
            @RequestParam(value = "adminNotes", required = false) String adminNotes) {
        try {
            RefundStatus refundStatus = RefundStatus.valueOf(status.toUpperCase());
            RefundRequest updatedRequest = refundService.updateRefundRequestStatus(id, refundStatus, adminNotes);
            return ResponseEntity.ok(updatedRequest);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid status value: " + status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error updating refund request: " + e.getMessage()));
        }
    }
    
    /**
     * Get refund request by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getRefundRequestById(@PathVariable Long id) {
        try {
            // Get current user
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = userService.getUserByUsername(auth.getName());
            
            RefundRequest refundRequest = refundService.getRefundRequestById(id);
            
            // Check if user has access to this refund request
            boolean isAdmin = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            
            if (refundRequest.getOrder().getUserId().equals(user.getId()) || isAdmin) {
                return ResponseEntity.ok(refundRequest);
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("You don't have permission to view this refund request"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error retrieving refund request: " + e.getMessage()));
        }
    }
    
    /**
     * Admin endpoints for processing refunds
     */
    
    // Admin endpoint cho refund yêu cầu được xử lý trong các endpoint khác
    // Không cần tạo API mới
} 