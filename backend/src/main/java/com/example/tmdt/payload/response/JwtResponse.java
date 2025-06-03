package com.example.tmdt.payload.response;

import lombok.Data;

import java.util.List;

@Data
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    private String primaryRole;
    private String phoneNumber;
    private String address;

//    public JwtResponse(String accessToken, Long id, String username, String email, String fullName, List<String> roles) {
//        this.token = accessToken;
//        this.id = id;
//        this.username = username;
//        this.email = email;
//        this.fullName = fullName;
//        this.roles = roles;
//    }
    
    public JwtResponse(String accessToken, Long id, String username, String email, String fullName, List<String> roles, String primaryRole,String phoneNumber,String address) {
        this.token = accessToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.primaryRole = primaryRole;
        this.phoneNumber = phoneNumber;
        this.address = address;
    }
} 