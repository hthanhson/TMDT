package com.example.tmdt.payload.request;

import lombok.Data;

@Data
public class CouponVerifyRequest {
    private String code;
    private Double orderAmount;
} 