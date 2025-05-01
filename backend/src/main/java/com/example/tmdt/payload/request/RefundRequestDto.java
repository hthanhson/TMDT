package com.example.tmdt.payload.request;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

import lombok.Data;

@Data
public class RefundRequestDto {
    @NotNull(message = "Order ID is required")
    private Long orderId;
    
    @NotBlank(message = "Reason is required")
    @Size(min = 10, max = 1000, message = "Reason must be between 10 and 1000 characters")
    private String reason;
    
    @Size(max = 2000, message = "Additional information cannot exceed 2000 characters")
    private String additionalInfo;
} 