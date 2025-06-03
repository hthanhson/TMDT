package com.example.tmdt.payload.request;

import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class UpdateProfileRequest {
    @Size(max = 50)
    @Email
    private String email;
    
    private String fullName;
    
    private String address;
    
    private String phoneNumber;
    
    @NotBlank(message = "Password is required to verify identity")
    private String password;
}
