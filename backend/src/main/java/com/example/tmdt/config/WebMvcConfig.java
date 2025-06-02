package com.example.tmdt.config;

import com.example.tmdt.model.User;
import com.example.tmdt.security.services.UserDetailsImpl;
import com.example.tmdt.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import java.util.List;

/**
 * Centralized web MVC configuration for the application
 * Combines functionality of previous WebMvcConfig and WebConfig classes
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfig.class);

    @Autowired
    private UserRepository userRepository;
    
    @Value("${spring.servlet.multipart.max-file-size:10MB}")
    private String maxFileSize;
    
    @Value("${spring.servlet.multipart.max-request-size:10MB}")
    private String maxRequestSize;

    /**
     * Configures custom argument resolvers for controller methods
     * This adds support for @AuthenticationPrincipal to inject User objects
     */
    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new CurrentUserArgumentResolver());
        logger.info("Added CurrentUserArgumentResolver to Spring MVC");
    }

    /**
     * Configures resource handlers for serving static files
     * Maps various URL patterns to physical file locations
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Configure resource handler for product images
        registry.addResourceHandler("/uploads/products/**")
                .addResourceLocations("file:./uploads/products/", "file:./backend/uploads/products/")
                .setCachePeriod(3600) // Cache for 1 hour
                .resourceChain(true);
        
        // Add handler for images served through the /images endpoint
        registry.addResourceHandler("/images/products/**")
                .addResourceLocations("file:./uploads/products/", "file:./backend/uploads/products/")
                .setCachePeriod(3600) // Cache for 1 hour
                .resourceChain(true);
        
        // Add handler for direct image access
        registry.addResourceHandler("/products/images/direct/**")
                .addResourceLocations("file:./uploads/products/", "file:./backend/uploads/products/")
                .setCachePeriod(3600) // Cache for 1 hour
                .resourceChain(true);
                
        // Add handler for product images by ID
        registry.addResourceHandler("/products/images/product/**")
                .addResourceLocations("file:./uploads/products/", "file:./backend/uploads/products/")
                .setCachePeriod(3600) // Cache for 1 hour
                .resourceChain(true);
                
        // Add handler for default product images
        registry.addResourceHandler("/products/images/default/**")
                .addResourceLocations("file:./uploads/products/", "file:./backend/uploads/products/")
                .setCachePeriod(3600) // Cache for 1 hour
                .resourceChain(true);
                
        // Improved resource handlers for refund images
        registry.addResourceHandler("/uploads/refunds/**")
                .addResourceLocations("file:./backend/uploads/refunds/", "file:./uploads/refunds/")
                .setCachePeriod(0) // No cache for refund evidence images
                .resourceChain(true);
        
        // Additional direct access path for refund images
        registry.addResourceHandler("/refunds/images/**")
                .addResourceLocations("file:./backend/uploads/refunds/", "file:./uploads/refunds/")
                .setCachePeriod(0)
                .resourceChain(true);
        
        // Add resource handlers for general uploads
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:backend/uploads/", "file:uploads/");
                
        // Explicitly serve from backend/uploads directory
        registry.addResourceHandler("/backend/uploads/**")
                .addResourceLocations("file:./backend/uploads/")
                .setCachePeriod(0);
                
        logger.info("Added resource handlers for static resources");
    }

    /**
     * Configures Cross-Origin Resource Sharing (CORS) for the application
     * Allows cross-origin requests from any origin with specified methods and headers
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders("Access-Control-Allow-Origin", "Access-Control-Allow-Methods")
                .maxAge(3600);
        
        logger.info("Configured CORS for all endpoints");
    }
    
    /**
     * Creates a MultipartResolver bean for handling file uploads
     * Uses the StandardServletMultipartResolver 
     */
    @Bean
    public MultipartResolver multipartResolver() {
        StandardServletMultipartResolver resolver = new StandardServletMultipartResolver();
        logger.info("Configured MultipartResolver with max file size: {}, max request size: {}", 
                maxFileSize, maxRequestSize);
        return resolver;
    }

    /**
     * Custom argument resolver for injecting the current authenticated User 
     * into controller methods annotated with @AuthenticationPrincipal
     */
    private class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            boolean supports = parameter.getParameterType().equals(User.class)
                    && parameter.hasParameterAnnotation(AuthenticationPrincipal.class);
            
            if (supports) {
                logger.debug("Found @AuthenticationPrincipal User parameter: {}", parameter.getMethod());
            }
            
            return supports;
        }

        @Override
        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                      NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
            logger.debug("Resolving @AuthenticationPrincipal User for parameter: {}", parameter.getMethod());
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null) {
                logger.debug("No Authentication found in SecurityContext");
                return null;
            }

            logger.debug("Authentication found: {}, principal class: {}", 
                authentication, authentication.getPrincipal().getClass().getName());
            
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetailsImpl) {
                UserDetailsImpl userDetails = (UserDetailsImpl) principal;
                logger.debug("Found UserDetailsImpl with id: {}", userDetails.getId());
                User user = userRepository.findById(userDetails.getId()).orElse(null);
                logger.debug("Resolved User: {}", user != null ? user.getId() : "null");
                return user;
            } else if (principal instanceof User) {
                logger.debug("Principal is already a User instance");
                return principal;
            } else if (principal instanceof String && "anonymousUser".equals(principal)) {
                logger.debug("Anonymous user, returning null");
                return null;
            }
            
            logger.warn("Unhandled principal type: {}", principal.getClass().getName());
            return null;
        }
    }
} 