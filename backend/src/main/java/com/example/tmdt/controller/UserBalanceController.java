package com.example.tmdt.controller;

import com.example.tmdt.model.BalanceTransaction;
import com.example.tmdt.model.User;
import com.example.tmdt.model.UserBalance;
import com.example.tmdt.payload.request.DepositRequest;
import com.example.tmdt.payload.response.MessageResponse;
import com.example.tmdt.service.UserBalanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/user-balance")
public class UserBalanceController {

    private final UserBalanceService userBalanceService;

    @Autowired
    public UserBalanceController(UserBalanceService userBalanceService) {
        this.userBalanceService = userBalanceService;
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserBalance(@AuthenticationPrincipal User user) {
        UserBalance balance = userBalanceService.getUserBalance(user);
        Map<String, Object> response = new HashMap<>();
        response.put("balance", balance.getBalance());
        response.put("lastDepositDate", balance.getLastDepositDate());
        response.put("lastWithdrawalDate", balance.getLastWithdrawalDate());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deposit(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DepositRequest depositRequest) {

        BigDecimal amount = new BigDecimal(depositRequest.getAmount());
        String description = depositRequest.getDescription();

        try {
            UserBalance updatedBalance = userBalanceService.deposit(user, amount, description);
            Map<String, Object> response = new HashMap<>();
            response.put("balance", updatedBalance.getBalance());
            response.put("message", "Deposit successful");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/withdraw")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> withdraw(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody Map<String, String> requestBody) {

        BigDecimal amount = new BigDecimal(requestBody.get("amount"));
        String description = requestBody.get("description");

        try {
            UserBalance updatedBalance = userBalanceService.withdraw(user, amount, description);
            Map<String, Object> response = new HashMap<>();
            response.put("balance", updatedBalance.getBalance());
            response.put("message", "Withdrawal successful");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getTransactionHistory(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("transactionDate").descending());
        Page<BalanceTransaction> transactions = userBalanceService.getTransactionHistory(user, pageable);

        return ResponseEntity.ok(transactions);
    }
} 