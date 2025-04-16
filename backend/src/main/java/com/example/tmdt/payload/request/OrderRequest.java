package com.example.tmdt.payload.request;

import java.util.List;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;

import lombok.Data;

@Data
public class OrderRequest {
    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItemRequest> items;
    
    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;
    
    @NotBlank(message = "Payment method is required")
    private String paymentMethod;
    
    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
    
    @NotBlank(message = "Recipient name is required")
    private String recipientName;
    
    private String couponCode;
    
    private Double total;
} 