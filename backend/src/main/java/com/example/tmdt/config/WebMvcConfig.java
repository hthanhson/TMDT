package com.example.tmdt.config;

import com.example.tmdt.model.User;
import com.example.tmdt.security.services.UserDetailsImpl;
import com.example.tmdt.repository.UserRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfig.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new CurrentUserArgumentResolver());
        logger.info("Added CurrentUserArgumentResolver to Spring MVC");
    }

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