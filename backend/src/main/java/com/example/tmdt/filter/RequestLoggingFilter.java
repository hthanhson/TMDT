package com.example.tmdt.filter;

import com.example.tmdt.utils.LoggerUtil;
import org.slf4j.Logger;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.UnsupportedEncodingException;

/**
 * Filter để ghi log tất cả các HTTP request và response
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerUtil.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        if (request.getContentType() != null && request.getContentType().contains("application/json")) {
            // Đây là request JSON, cần đặc biệt cẩn thận khi xử lý body
            logger.debug("Processing JSON request to {}", request.getRequestURI());
            
            // Thiết lập context cho request
            LoggerUtil.configureRequestContext(request);
            
            // Wrap request để có thể đọc nhiều lần
            ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
            
            try {
                // Chuyển tiếp request mà không log trước khi xử lý
                filterChain.doFilter(requestWrapper, responseWrapper);
                
                // Sau khi xử lý, thì mới log để không ảnh hưởng đến body
                logRequestAfterProcessing(requestWrapper);
                logResponse(responseWrapper, 0);
            } finally {
                LoggerUtil.clearRequestContext();
                responseWrapper.copyBodyToResponse();
            }
        } else {
            // Xử lý bình thường cho các request không phải JSON
            long startTime = System.currentTimeMillis();
            
            // Thiết lập context cho request
            LoggerUtil.configureRequestContext(request);
            
            // Wrap request và response để có thể đọc nhiều lần
            ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

            try {
                // Log trước khi xử lý request
                logRequest(requestWrapper);
                
                // Xử lý request
                filterChain.doFilter(requestWrapper, responseWrapper);
                
                // Log sau khi xử lý request
                logResponse(responseWrapper, System.currentTimeMillis() - startTime);
            } finally {
                // Xóa context
                LoggerUtil.clearRequestContext();
                
                // Copy nội dung response đã bị tiêu thụ khi đọc
                responseWrapper.copyBodyToResponse();
            }
        }
    }

    private void logRequest(ContentCachingRequestWrapper request) {
        if (logger.isInfoEnabled()) {
            logger.info("REQUEST: {} {}", request.getMethod(), request.getRequestURI());
            logger.info("HEADERS: {}", getRequestHeaders(request));
            
            // Log body cho các request POST, PUT, PATCH
            String method = request.getMethod();
            if (("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) 
                    && request.getContentLength() > 0) {
                // Không log body cho URLs nhạy cảm như login, register
                String uri = request.getRequestURI();
                if (!uri.contains("/login") && !uri.contains("/register") && !uri.contains("/password")) {
                    logger.debug("REQUEST BODY: {}", getRequestBody(request));
                } else {
                    logger.debug("REQUEST BODY: [Sensitive data hidden]");
                }
            }
        }
    }

    private void logResponse(ContentCachingResponseWrapper response, long executionTime) {
        if (logger.isInfoEnabled()) {
            logger.info("RESPONSE: Status={}, Time={}ms", 
                       response.getStatus(), executionTime);
            
            // Chỉ log body với level DEBUG
            if (logger.isDebugEnabled() && response.getContentSize() > 0) {
                logger.debug("RESPONSE BODY: {}", getResponseBody(response));
            }
        }
    }

    private String getRequestHeaders(HttpServletRequest request) {
        StringBuilder headers = new StringBuilder();
        java.util.Enumeration<String> headerNames = request.getHeaderNames();
        
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            // Bỏ qua các header nhạy cảm
            if (!"authorization".equalsIgnoreCase(name) && 
                !"cookie".equalsIgnoreCase(name)) {
                headers.append(name).append("=").append(request.getHeader(name)).append(", ");
            }
        }
        
        return headers.toString();
    }

    private String getRequestBody(ContentCachingRequestWrapper request) {
        try {
            byte[] buf = request.getContentAsByteArray();
            if (buf.length > 0) {
                String requestBody = new String(buf, 0, buf.length, request.getCharacterEncoding());
                logger.debug("Raw request body content: {}", requestBody);
                return requestBody;
            } else {
                // Thêm thông tin chi tiết để debug
                logger.debug("Request body bytes empty but content length: {}", request.getContentLength());
                logger.debug("Request character encoding: {}", request.getCharacterEncoding());
                logger.debug("Content type: {}", request.getContentType());
                logger.debug("Request URI: {}", request.getRequestURI());
                
                // Thử đọc request body từ InputStream
                try {
                    byte[] buffer = new byte[request.getContentLength()];
                    request.getInputStream().read(buffer);
                    if (buffer.length > 0) {
                        String body = new String(buffer, request.getCharacterEncoding());
                        logger.debug("Request body from input stream: {}", body);
                        return body;
                    }
                } catch (Exception e) {
                    logger.warn("Could not read request body from input stream", e);
                }
            }
        } catch (UnsupportedEncodingException ex) {
            logger.warn("Failed to parse request body", ex);
        } catch (Exception ex) {
            logger.warn("Unexpected error in getRequestBody", ex);
        }
        
        return "[Empty]";
    }

    private String getResponseBody(ContentCachingResponseWrapper response) {
        try {
            byte[] buf = response.getContentAsByteArray();
            if (buf.length > 0) {
                return new String(buf, 0, Math.min(buf.length, 1024), response.getCharacterEncoding());
            }
        } catch (UnsupportedEncodingException ex) {
            logger.warn("Failed to parse response body", ex);
        }
        
        return "[Empty]";
    }

    // Thêm phương thức mới để log request sau khi xử lý
    private void logRequestAfterProcessing(ContentCachingRequestWrapper request) {
        if (logger.isInfoEnabled()) {
            logger.info("REQUEST: {} {}", request.getMethod(), request.getRequestURI());
            logger.info("HEADERS: {}", getRequestHeaders(request));
            
            // Log body cho các request POST, PUT, PATCH
            String method = request.getMethod();
            if (("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method)) 
                    && request.getContentLength() > 0) {
                // Không log body cho URLs nhạy cảm như login, register
                String uri = request.getRequestURI();
                if (!uri.contains("/login") && !uri.contains("/register") && !uri.contains("/password")) {
                    logger.debug("REQUEST BODY: {}", getRequestBody(request));
                } else {
                    logger.debug("REQUEST BODY: [Sensitive data hidden]");
                }
            }
        }
    }
} 