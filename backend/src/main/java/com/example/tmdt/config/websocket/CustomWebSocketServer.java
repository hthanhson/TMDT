package com.example.tmdt.config.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

import org.apache.catalina.connector.Connector;
import org.apache.tomcat.websocket.server.WsSci;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;

@Configuration
public class CustomWebSocketServer {

    @Value("${websocket.server.port:8089}")
    private int websocketPort;

    // This bean creates an additional connector on the specified port
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> servletContainerCustomizer() {
        return factory -> {
            Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            connector.setPort(websocketPort);
            factory.addAdditionalTomcatConnectors(connector);
            
            // Add WebSocket processor to the context
            factory.addContextCustomizers(context -> {
                context.addServletContainerInitializer(new WsSci(), null);
            });
            
            System.out.println("WebSocket server configured to run on port: " + websocketPort);
        };
    }
    
    // Configure WebSocket container
    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(8192);
        container.setMaxBinaryMessageBufferSize(8192);
        return container;
    }
} 