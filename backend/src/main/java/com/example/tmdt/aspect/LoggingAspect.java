package com.example.tmdt.aspect;

import com.example.tmdt.utils.LoggerUtil;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

/**
 * Aspect để ghi log tất cả các method trong controller và service
 */
@Aspect
@Component
public class LoggingAspect {

    /**
     * Pointcut cho tất cả các method trong controller package
     */
    @Pointcut("execution(* com.example.tmdt.controller.*.*(..))")
    public void controllerMethods() {
    }

    /**
     * Pointcut cho tất cả các method trong service package 
     */
    @Pointcut("execution(* com.example.tmdt.service.*.*(..))")
    public void serviceMethods() {
    }

    /**
     * Ghi log trước khi method được thực thi
     */
    @Before("controllerMethods() || serviceMethods()")
    public void logBefore(JoinPoint joinPoint) {
        final Logger logger = getLogger(joinPoint);
        if (logger.isDebugEnabled()) {
            String methodName = getMethodName(joinPoint);
            LoggerUtil.logMethodEntry(logger, methodName, joinPoint.getArgs());
        }
    }

    /**
     * Ghi log sau khi method thực thi thành công
     */
    @AfterReturning(pointcut = "controllerMethods() || serviceMethods()", returning = "result")
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
        final Logger logger = getLogger(joinPoint);
        if (logger.isDebugEnabled()) {
            String methodName = getMethodName(joinPoint);
            LoggerUtil.logMethodExit(logger, methodName, result);
        }
    }

    /**
     * Ghi log khi method ném ra exception
     */
    @AfterThrowing(pointcut = "controllerMethods() || serviceMethods()", throwing = "exception")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable exception) {
        final Logger logger = getLogger(joinPoint);
        String methodName = getMethodName(joinPoint);
        logger.error("Exception in {}() with cause = {}", methodName, 
                     exception.getMessage() != null ? exception.getMessage() : "NULL");
    }

    /**
     * Ghi log thời gian thực thi của method
     */
    @Around("controllerMethods() || serviceMethods()")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        final Logger logger = getLogger(joinPoint);
        long startTime = System.currentTimeMillis();
        
        try {
            return joinPoint.proceed();
        } finally {
            if (logger.isDebugEnabled()) {
                String methodName = getMethodName(joinPoint);
                LoggerUtil.logExecutionTime(logger, methodName, startTime);
            }
        }
    }

    /**
     * Lấy logger cho class chứa method
     */
    private Logger getLogger(JoinPoint joinPoint) {
        return LoggerUtil.getLogger(joinPoint.getTarget().getClass());
    }

    /**
     * Lấy tên method từ joinpoint
     */
    private String getMethodName(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        return method.getName();
    }
} 