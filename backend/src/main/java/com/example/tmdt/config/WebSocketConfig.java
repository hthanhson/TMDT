package com.example.tmdt.config;

import com.example.tmdt.websocket.ChatWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.standard.ServerEndpointExporter;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.apache.catalina.connector.Connector;

@Configuration
@EnableWebSocketMessageBroker
@EnableWebSocket
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer, WebSocketConfigurer {

    // WebSocket will use the separate port
    @Value("${websocket.server.port:8089}")
    private int webSocketPort;
    
    @Value("${server.port:8080}")
    private int serverPort;
    
    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws" endpoint, enabling the SockJS protocol
        // SockJS is used to enable fallback options for browsers that don't support WebSocket
        registry.addEndpoint("/ws")
               .setAllowedOrigins("http://localhost:3000", "http://localhost:3001")
               .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Set prefixes for messages that are bound for message-handling methods
        registry.setApplicationDestinationPrefixes("/app");
        
        // Set prefix for messages that are bound for the broker
        registry.enableSimpleBroker("/topic", "/queue", "/user");
        
        // Set prefix for user-specific messages
        registry.setUserDestinationPrefix("/user");
    }
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Register handler without SockJS for direct WebSocket connection
        registry.addHandler(chatWebSocketHandler, "/chat")
            .setAllowedOrigins("http://localhost:3000", "http://localhost:3001");
            
        // Also register with SockJS for fallback
        registry.addHandler(chatWebSocketHandler, "/chat-sockjs")
            .setAllowedOrigins("http://localhost:3000", "http://localhost:3001")
            .withSockJS();
    }
    
    /**
     * Configure additional connector for WebSocket on a different port
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> servletContainerCustomizer() {
        return factory -> {
            // Only create second connector if ports are different
            if (webSocketPort != serverPort) {
                Connector connector = new Connector("org.apache.coyote.http11.Http11NioProtocol");
                connector.setPort(webSocketPort);
                factory.addAdditionalTomcatConnectors(connector);
            }
        };
    }
    
    @Bean
    public ServerEndpointExporter serverEndpointExporter() {
        return new ServerEndpointExporter();
    }
} 