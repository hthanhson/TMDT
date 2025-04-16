package com.example.tmdt.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class OperationNotAllowedException extends RuntimeException {
    public OperationNotAllowedException(String message) {
        super(message);
    }
    
    public OperationNotAllowedException(String message, Throwable cause) {
        super(message, cause);
    }
} 