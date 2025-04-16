package com.example.tmdt.payload.request;

import com.example.tmdt.model.Order.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatusUpdateRequest {
    @NotNull(message = "Status cannot be null")
    private OrderStatus status;
    
    private String location;
    
    private String notes;
    
    private Double latitude;
    
    private Double longitude;
} 