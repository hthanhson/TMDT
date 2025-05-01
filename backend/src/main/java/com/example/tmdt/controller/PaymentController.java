package com.example.tmdt.controller;

import com.example.tmdt.config.VNPayConfig;

import com.example.tmdt.model.Order;
import com.example.tmdt.model.User;
import com.example.tmdt.payload.request.OrderRequest;
import com.example.tmdt.service.OrderService;
import com.example.tmdt.service.UserService;
import com.example.tmdt.service.VNPayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.UnsupportedEncodingException;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@RestController
@RequestMapping
public class PaymentController {
    private final OrderService orderService;
    private final UserService userService;
    private final VNPayService vnpayService ;
    @Autowired
    public PaymentController(OrderService orderService, UserService userService, VNPayService vnpayService) {
        this.orderService = orderService;
        this.userService = userService;
        this.vnpayService = vnpayService;
    }
    @PostMapping("/orders/pay")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<String> createPay(@RequestBody OrderRequest orderRequest) throws UnsupportedEncodingException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByUsername(auth.getName());
        BigDecimal amount = orderService.GetAmount(user, orderRequest);
        String vnpay=vnpayService.create_payment(amount);
        return ResponseEntity.ok(vnpay);
    }

    @GetMapping("/PaySuccess")
    public ResponseEntity<String>transaction(
            @RequestParam(value ="vnp_ResponseCode") String responseCode
    ){
        String res = responseCode.equals("00") ? "Success" : "Fail";
        return ResponseEntity.ok(res);
    }
}