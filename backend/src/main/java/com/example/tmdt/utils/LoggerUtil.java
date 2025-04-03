package com.example.tmdt.utils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import javax.servlet.http.HttpServletRequest;
import java.util.UUID;

/**
 * Lớp tiện ích cho việc ghi log trong ứng dụng
 */
public class LoggerUtil {

    /**
     * Tạo một logger mới cho lớp được chỉ định
     *
     * @param clazz Lớp cần tạo logger
     * @return Logger được cấu hình
     */
    public static Logger getLogger(Class<?> clazz) {
        return LoggerFactory.getLogger(clazz);
    }

    /**
     * Thiết lập MDC (Mapped Diagnostic Context) cho request hiện tại
     * Hữu ích cho việc theo dõi các request qua nhiều lớp và service
     *
     * @param request HTTP request
     */
    public static void configureRequestContext(HttpServletRequest request) {
        String requestId = UUID.randomUUID().toString();
        MDC.put("requestId", requestId);
        
        if (request != null) {
            MDC.put("remoteIp", request.getRemoteAddr());
            MDC.put("userAgent", request.getHeader("User-Agent"));
            MDC.put("requestURI", request.getRequestURI());
            MDC.put("method", request.getMethod());
        }
    }

    /**
     * Xóa dữ liệu MDC sau khi xử lý request xong
     */
    public static void clearRequestContext() {
        MDC.clear();
    }

    /**
     * Ghi log bắt đầu của một hàm
     *
     * @param logger Logger được sử dụng
     * @param methodName Tên của hàm
     * @param args Tham số truyền vào (nếu cần)
     */
    public static void logMethodEntry(Logger logger, String methodName, Object... args) {
        if (logger.isDebugEnabled()) {
            StringBuilder message = new StringBuilder("ENTERING ");
            message.append(methodName);
            if (args != null && args.length > 0) {
                message.append(" with args: [");
                for (int i = 0; i < args.length; i++) {
                    if (i > 0) message.append(", ");
                    message.append(args[i]);
                }
                message.append("]");
            }
            logger.debug(message.toString());
        }
    }

    /**
     * Ghi log kết thúc của một hàm
     *
     * @param logger Logger được sử dụng
     * @param methodName Tên của hàm
     * @param result Kết quả trả về (nếu có)
     */
    public static void logMethodExit(Logger logger, String methodName, Object result) {
        if (logger.isDebugEnabled()) {
            StringBuilder message = new StringBuilder("EXITING ");
            message.append(methodName);
            if (result != null) {
                message.append(" with result: [").append(result).append("]");
            }
            logger.debug(message.toString());
        }
    }

    /**
     * Ghi log thời gian thực thi của một hàm
     *
     * @param logger Logger được sử dụng
     * @param methodName Tên của hàm
     * @param startTime Thời gian bắt đầu
     */
    public static void logExecutionTime(Logger logger, String methodName, long startTime) {
        if (logger.isDebugEnabled()) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.debug("Method {} executed in {} ms", methodName, executionTime);
        }
    }
} 