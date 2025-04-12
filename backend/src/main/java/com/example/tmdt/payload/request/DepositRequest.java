package com.example.tmdt.payload.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;

@Data
public class DepositRequest {
    @NotBlank
    @Positive
    private String amount;
    
    private String description;
} 