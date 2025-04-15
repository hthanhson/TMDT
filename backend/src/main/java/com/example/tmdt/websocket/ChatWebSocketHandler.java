package com.example.tmdt.websocket;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.HashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.example.tmdt.service.ChatService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.example.tmdt.model.ChatSession;
import com.example.tmdt.model.ChatMessage;
import com.example.tmdt.repository.ChatSessionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;

/**
 * WebSocketHandler for managing chat between users and admins
 */
@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private ChatSessionRepository chatSessionRepository;
    
    // Store user WebSocket sessions by sessionId
    private Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    
    // Store admin sessions by adminId
    private Map<String, WebSocketSession> adminSessions = new ConcurrentHashMap<>();
    
    // Maps userId to sessionId
    private Map<String, String> userIdToSessionId = new ConcurrentHashMap<>();
    
    // Store WebSocket session mapped to sessionId
    private Map<String, String> webSocketSessionToSessionId = new ConcurrentHashMap<>();
    
    /**
     * Helper method to safely get values from JsonNode
     */
    private String getSafeNodeValue(JsonNode node, String field, String defaultValue) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asText();
        }
        return defaultValue;
    }
    
    /**
     * Helper method to safely get boolean values from JsonNode
     */
    private boolean getSafeBooleanValue(JsonNode node, String field, boolean defaultValue) {
        if (node != null && node.has(field) && !node.get(field).isNull()) {
            return node.get(field).asBoolean();
        }
        return defaultValue;
    }
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        logger.info("WebSocket connection established: {}", session.getId());
        // Log headers for debugging
        session.getHandshakeHeaders().forEach((key, values) -> {
            logger.debug("Header {}: {}", key, values);
        });
        logger.info("Remote address: {}", session.getRemoteAddress());
        logger.info("URI: {}", session.getUri());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        logger.info("Received message: {}", payload);
        
        try {
            JsonNode jsonNode = objectMapper.readTree(payload);
            String type = getSafeNodeValue(jsonNode, "type", "UNKNOWN");
            
            if ("UNKNOWN".equals(type)) {
                logger.warn("Message received without type field: {}", payload);
                ObjectNode errorNode = objectMapper.createObjectNode();
                errorNode.put("type", "ERROR");
                errorNode.put("message", "Message type is missing or invalid");
                session.sendMessage(new TextMessage(errorNode.toString()));
                return;
            }
            
            switch (type) {
                case "USER_CONNECT":
                    handleUserConnect(session, jsonNode);
                    break;
                    
                case "CHAT_MESSAGE":
                    handleChatMessage(session, jsonNode);
                    break;
                    
                case "ADMIN_CONNECT":
                case "ADMIN_LOGIN":
                    handleAdminConnect(session, jsonNode);
                    break;
                    
                case "DISCONNECT":
                    handleDisconnect(session);
                    break;
                    
                case "END_CHAT":
                    handleEndChat(session, jsonNode);
                    break;
                    
                default:
                    logger.warn("Unknown message type: {}", type);
                    ObjectNode errorNode = objectMapper.createObjectNode();
                    errorNode.put("type", "ERROR");
                    errorNode.put("message", "Unknown message type: " + type);
                    session.sendMessage(new TextMessage(errorNode.toString()));
            }
        } catch (Exception e) {
            logger.error("Error processing message", e);
            ObjectNode errorNode = objectMapper.createObjectNode();
            errorNode.put("type", "ERROR");
            errorNode.put("message", "Error processing message: " + e.getMessage());
            session.sendMessage(new TextMessage(errorNode.toString()));
        }
    }

    private void handleUserConnect(WebSocketSession session, JsonNode jsonNode) throws IOException {
        // Check required fields
        String userId = getSafeNodeValue(jsonNode, "userId", null);
        if (userId == null) {
            logger.error("Missing required field 'userId' in USER_CONNECT message");
            ObjectNode errorMsg = objectMapper.createObjectNode();
            errorMsg.put("type", "ERROR");
            errorMsg.put("message", "Missing required field 'userId' in connect message");
            session.sendMessage(new TextMessage(errorMsg.toString()));
            return;
        }
        
        String username = getSafeNodeValue(jsonNode, "username", null);
        if (username == null) {
            logger.error("Missing required field 'username' in USER_CONNECT message");
            ObjectNode errorMsg = objectMapper.createObjectNode();
            errorMsg.put("type", "ERROR");
            errorMsg.put("message", "Missing required field 'username' in connect message");
            session.sendMessage(new TextMessage(errorMsg.toString()));
            return;
        }
        
        boolean isAnonymous = getSafeBooleanValue(jsonNode, "isAnonymous", false);
        
        logger.info("User connected: {} ({}) isAnonymous: {}", username, userId, isAnonymous);
        
        String sessionId = getSafeNodeValue(jsonNode, "sessionId", null);
        if (sessionId == null) {
            // Try to get existing session ID for this user
            sessionId = userIdToSessionId.get(userId);
            
            if (sessionId == null) {
                // No session ID provided or found, check if user has an active session
                try {
                    Optional<ChatSession> activeSession = chatService.getActiveChatSession(userId);
                    if (activeSession.isPresent()) {
                        sessionId = activeSession.get().getId();
                        logger.info("Found existing active session ID {} for user {}", sessionId, userId);
                    } else {
                        // Create a new session if needed
                        logger.info("Creating new chat session for user {}", userId);
                        try {
                            ChatSession newSession = chatService.createChatSession(userId, username);
                            sessionId = newSession.getId();
                            logger.info("Created new session ID {} for user {}", sessionId, userId);
                        } catch (Exception e) {
                            logger.error("Error creating chat session for user {}: {}", userId, e.getMessage(), e);
                            ObjectNode errorMsg = objectMapper.createObjectNode();
                            errorMsg.put("type", "ERROR");
                            errorMsg.put("message", "Failed to create chat session: " + e.getMessage());
                            session.sendMessage(new TextMessage(errorMsg.toString()));
                            return;
                        }
                    }
                } catch (Exception e) {
                    logger.error("Error checking active session for user {}: {}", userId, e.getMessage(), e);
                }
            } else {
                logger.info("Using existing session ID {} from map for user {}", sessionId, userId);
            }
        }
        
        // Store the mappings
        if (sessionId != null) {
            logger.info("Storing mappings for user {} with session ID {}", userId, sessionId);
            userSessions.put(sessionId, session);
            userIdToSessionId.put(userId, sessionId);
            webSocketSessionToSessionId.put(session.getId(), sessionId);
            
            // Send successful connection response to user
            ObjectNode response = objectMapper.createObjectNode();
            response.put("type", "CONNECTION_ESTABLISHED");
            response.put("userId", userId);
            response.put("username", username);
            response.put("sessionId", sessionId);
            response.put("timestamp", System.currentTimeMillis());
            
            session.sendMessage(new TextMessage(response.toString()));
            
            // Load and send previous messages to the user
            try {
                List<ChatMessage> messages = chatService.getMessagesByChatSession(sessionId);
                
                if (!messages.isEmpty()) {
                    logger.info("Sending {} previous messages to user {}", messages.size(), userId);
                    
                    for (ChatMessage msg : messages) {
                        ObjectNode historicalMessage = objectMapper.createObjectNode();
                        historicalMessage.put("type", "CHAT_MESSAGE");
                        historicalMessage.put("userId", msg.getSenderId());
                        historicalMessage.put("username", msg.getSenderName());
                        historicalMessage.put("content", msg.getContent());
                        historicalMessage.put("timestamp", msg.getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC) * 1000);
                        historicalMessage.put("sender", msg.getSenderType().toString().toLowerCase());
                        historicalMessage.put("senderType", msg.getSenderType().toString());
                        historicalMessage.put("sessionId", sessionId);
                        historicalMessage.put("historical", true);
                        historicalMessage.put("messageId", msg.getId().toString());
                        
                        session.sendMessage(new TextMessage(historicalMessage.toString()));
                    }
                }
            } catch (Exception e) {
                logger.error("Error sending message history to user {}: {}", userId, e.getMessage(), e);
            }
            
            // Notify all connected admins about this user
            notifyAdminsAboutNewUser(userId, username, sessionId);
        } else {
            logger.error("Failed to establish session for user {}", userId);
            ObjectNode errorMsg = objectMapper.createObjectNode();
            errorMsg.put("type", "ERROR");
            errorMsg.put("message", "Failed to establish chat session");
            session.sendMessage(new TextMessage(errorMsg.toString()));
        }
    }

    private void handleChatMessage(WebSocketSession session, JsonNode jsonNode) throws IOException {
        String senderId = getSafeNodeValue(jsonNode, "userId", null);
        String username = getSafeNodeValue(jsonNode, "username", null);
        String content = getSafeNodeValue(jsonNode, "content", null);
        String sessionId = getSafeNodeValue(jsonNode, "sessionId", null);
        String senderType = getSafeNodeValue(jsonNode, "senderType", null);
        String messageId = getSafeNodeValue(jsonNode, "messageId", null);
        if (senderType == null) {
            senderType = getSafeNodeValue(jsonNode, "sender", null);  // Fallback to sender field
        }
        
        if (content == null || content.trim().isEmpty()) {
            logger.error("Message content cannot be empty");
            ObjectNode errorMessage = objectMapper.createObjectNode();
            errorMessage.put("type", "ERROR");
            errorMessage.put("message", "Message content cannot be empty");
            session.sendMessage(new TextMessage(errorMessage.toString()));
            return;
        }
        
        logger.info("Handling chat message - sender: {}, username: {}, sessionId: {}, senderType: {}, messageId: {}, content length: {}", 
                    senderId, username, sessionId, senderType, messageId, (content != null ? content.length() : 0));
        
        try {
            // Determine if the sender is an admin
            boolean isAdmin = ("ADMIN".equalsIgnoreCase(senderType) || "admin".equals(senderType) || adminSessions.containsKey(senderId));
            logger.info("Message is from an admin: {}", isAdmin);
            
            if (isAdmin) {
                // Admin sending a message to a user
                logger.info("Admin {} is sending a message to session: {}", senderId, sessionId);
                
                if (sessionId == null) {
                    ObjectNode errorMessage = objectMapper.createObjectNode();
                    errorMessage.put("type", "ERROR");
                    errorMessage.put("message", "Session ID is required for admin messages");
                    session.sendMessage(new TextMessage(errorMessage.toString()));
                    logger.error("Session ID is missing in admin message");
                    return;
                }
                
                // Find user's WebSocket session using sessionId
                WebSocketSession userSession = userSessions.get(sessionId);
                logger.info("User session found using sessionId {}: {}", sessionId, (userSession != null));
                
                boolean messageSent = false;
                
                // If user is connected, send the message directly
                if (userSession != null && userSession.isOpen()) {
                    try {
                        // Create message to send to user
                        ObjectNode messageToUser = objectMapper.createObjectNode();
                        messageToUser.put("type", "CHAT_MESSAGE");
                        messageToUser.put("userId", senderId);
                        messageToUser.put("username", username);
                        messageToUser.put("content", content);
                        messageToUser.put("timestamp", System.currentTimeMillis());
                        messageToUser.put("sender", "admin"); 
                        messageToUser.put("senderType", "ADMIN");
                        messageToUser.put("sessionId", sessionId);
                        
                        // Add message ID to avoid duplicates
                        if (messageId == null) {
                            messageId = String.valueOf(System.currentTimeMillis());
                        }
                        messageToUser.put("messageId", messageId);
                        
                        String messageToUserJson = messageToUser.toString();
                        logger.info("Sending admin message to user (session: {}): {}", sessionId, messageToUserJson);
                        
                        userSession.sendMessage(new TextMessage(messageToUserJson));
                        logger.info("Successfully sent admin message to user with session ID: {}", sessionId);
                        messageSent = true;
                        
                        // Confirm to admin that message was sent
                        ObjectNode confirmMessage = objectMapper.createObjectNode();
                        confirmMessage.put("type", "MESSAGE_DELIVERED");
                        confirmMessage.put("sessionId", sessionId);
                        confirmMessage.put("messageId", messageId);
                        confirmMessage.put("timestamp", System.currentTimeMillis());
                        session.sendMessage(new TextMessage(confirmMessage.toString()));
                        
                        // Broadcast to all other admin sessions about the new message
                        broadcastMessageToAdmins(messageToUser, senderId);
                    } catch (IOException e) {
                        logger.error("Error sending message to user {}: {}", sessionId, e.getMessage(), e);
                        // Remove invalid user session
                        userSessions.remove(sessionId);
                        
                        // Notify admin of delivery failure
                        ObjectNode errorMessage = objectMapper.createObjectNode();
                        errorMessage.put("type", "ERROR");
                        errorMessage.put("message", "Failed to deliver message: " + e.getMessage());
                        errorMessage.put("sessionId", sessionId);
                        session.sendMessage(new TextMessage(errorMessage.toString()));
                    }
                } else {
                    // If user is not connected, inform the admin
                    logger.info("User with session ID {} is not currently connected. Message will be saved.", sessionId);
                    ObjectNode offlineNotice = objectMapper.createObjectNode();
                    offlineNotice.put("type", "USER_OFFLINE");
                    offlineNotice.put("sessionId", sessionId);
                    offlineNotice.put("message", "User is offline. Message will be saved and delivered when they reconnect.");
                    session.sendMessage(new TextMessage(offlineNotice.toString()));
                }
                
                // Only save the message to database if not already saved by frontend
                boolean savedToDatabase = getSafeBooleanValue(jsonNode, "savedToDatabase", false);
                
                if (!savedToDatabase) {
                    // Save admin message to database
                    try {
                        // Save message to database
                        ChatMessage chatMessage = chatService.saveMessage(
                            content,
                            senderId,
                            username != null ? username : "Admin",
                            null, // receiverId can be null for admin messages
                            ChatMessage.SenderType.ADMIN,
                            sessionId
                        );
                        logger.info("Admin message saved to database with ID {} for session: {}", 
                                     chatMessage.getId(), sessionId);
                    } catch (Exception e) {
                        logger.error("Error saving admin message to database: {}", e.getMessage(), e);
                        ObjectNode errorMessage = objectMapper.createObjectNode();
                        errorMessage.put("type", "ERROR");
                        errorMessage.put("message", "Message was " + (messageSent ? "delivered but " : "") + "failed to save: " + e.getMessage());
                        session.sendMessage(new TextMessage(errorMessage.toString()));
                    }
                } else {
                    // Message already saved by frontend
                    String dbMessageId = getSafeNodeValue(jsonNode, "dbMessageId", messageId);
                    logger.info("Admin message already saved in database with ID {}, skipping database save", dbMessageId);
                }
            } else {
                // User sending a message
                logger.info("User {} is sending a message, sessionId: {}", senderId, sessionId);
                
                if (sessionId == null) {
                    // Try to get current session from memory map
                    sessionId = userIdToSessionId.get(senderId);
                    logger.info("No sessionId provided, retrieved from map: {}", sessionId);
                    
                    if (sessionId == null) {
                        logger.error("No chat session ID for user {}", senderId);
                        ObjectNode errorMessage = objectMapper.createObjectNode();
                        errorMessage.put("type", "ERROR");
                        errorMessage.put("message", "No active chat session found");
                        session.sendMessage(new TextMessage(errorMessage.toString()));
                        return;
                    }
                }
                
                // Update the mappings with the current session info
                userSessions.put(sessionId, session);
                userIdToSessionId.put(senderId, sessionId);
                webSocketSessionToSessionId.put(session.getId(), sessionId);
                
                // Only save the message to database if not already saved by frontend
                boolean savedToDatabase = getSafeBooleanValue(jsonNode, "savedToDatabase", false);
                ChatMessage chatMessage = null;
                
                if (!savedToDatabase) {
                    try {
                        // Save the message using the ChatService method
                        String senderName = username != null ? username : "User " + senderId;
                        chatMessage = chatService.saveMessage(
                            content,
                            senderId,
                            senderName,
                            null, // receiverId can be null for user messages
                            ChatMessage.SenderType.USER,
                            sessionId
                        );
                        
                        // Use the newly created message ID if none was provided
                        if (messageId == null) {
                            messageId = chatMessage.getId().toString();
                        }
                        
                        logger.info("User message saved to database with ID {} for session: {}", 
                                    chatMessage.getId(), sessionId);
                    } catch (Exception e) {
                        logger.error("Error saving user message to database: {}", e.getMessage(), e);
                        ObjectNode errorMessage = objectMapper.createObjectNode();
                        errorMessage.put("type", "ERROR");
                        errorMessage.put("message", "Failed to save message: " + e.getMessage());
                        session.sendMessage(new TextMessage(errorMessage.toString()));
                        return;
                    }
                } else {
                    // Message already saved by frontend
                    String dbMessageId = getSafeNodeValue(jsonNode, "dbMessageId", messageId);
                    logger.info("User message already saved in database with ID {}, skipping database save", dbMessageId);
                }
                
                // Forward the message to all connected admins
                int adminNotificationsCount = 0;
                
                logger.info("Attempting to forward message to {} admin sessions", adminSessions.size());

                // Create message to send to admins
                ObjectNode messageToAdmin = objectMapper.createObjectNode();
                messageToAdmin.put("type", "CHAT_MESSAGE");
                messageToAdmin.put("userId", senderId);
                messageToAdmin.put("username", username);
                messageToAdmin.put("content", content);
                messageToAdmin.put("timestamp", System.currentTimeMillis());
                messageToAdmin.put("sender", "user");
                messageToAdmin.put("senderType", "USER");
                messageToAdmin.put("sessionId", sessionId);
                
                // Add message ID to avoid duplicates
                if (messageId == null) {
                    messageId = chatMessage != null ? chatMessage.getId().toString() : String.valueOf(System.currentTimeMillis());
                }
                messageToAdmin.put("messageId", messageId);
                
                for (Map.Entry<String, WebSocketSession> entry : adminSessions.entrySet()) {
                    WebSocketSession adminSession = entry.getValue();
                    String adminId = entry.getKey();
                    
                    if (adminSession != null && adminSession.isOpen()) {
                        try {
                            String messageToAdminJson = messageToAdmin.toString();
                            logger.info("Forwarding user message to admin {}: {}", adminId, messageToAdminJson);
                            
                            adminSession.sendMessage(new TextMessage(messageToAdminJson));
                            adminNotificationsCount++;
                            logger.info("Successfully forwarded message to admin {}", adminId);
                        } catch (IOException e) {
                            logger.error("Error forwarding message to admin {}: {}", adminId, e.getMessage(), e);
                            // Remove invalid admin session
                            adminSessions.remove(adminId);
                        }
                    } else {
                        logger.warn("Admin session for {} is not open, removing from sessions map", adminId);
                        adminSessions.remove(adminId);
                    }
                }
                
                // Confirm receipt and inform if admins received the message
                ObjectNode confirmationMessage = objectMapper.createObjectNode();
                confirmationMessage.put("type", "MESSAGE_DELIVERED");
                confirmationMessage.put("adminCount", adminNotificationsCount);
                confirmationMessage.put("timestamp", System.currentTimeMillis());
                confirmationMessage.put("sessionId", sessionId);
                confirmationMessage.put("messageId", messageId);
                session.sendMessage(new TextMessage(confirmationMessage.toString()));
                logger.info("Message delivery confirmation sent to user {}. Message delivered to {} admins", senderId, adminNotificationsCount);
            }
        } catch (Exception e) {
            logger.error("Error processing chat message: {}", e.getMessage(), e);
            ObjectNode errorMessage = objectMapper.createObjectNode();
            errorMessage.put("type", "ERROR");
            errorMessage.put("message", "Error processing message: " + e.getMessage());
            session.sendMessage(new TextMessage(errorMessage.toString()));
        }
    }

    private void handleAdminConnect(WebSocketSession session, JsonNode jsonNode) throws IOException {
        // Check for adminId
        String adminId = getSafeNodeValue(jsonNode, "adminId", session.getId());
        String adminName = getSafeNodeValue(jsonNode, "adminName", "Admin");
        
        // Store admin session
        adminSessions.put(adminId, session);
        
        logger.info("Admin connected: {} ({}), Session ID: {}", adminName, adminId, session.getId());
        logger.info("Admin sessions after connection: {}", adminSessions.keySet());
        
        // Notify the admin about successful connection
        ObjectNode response = objectMapper.createObjectNode();
        response.put("type", "CONNECTION_ESTABLISHED");
        response.put("adminId", adminId);
        response.put("timestamp", System.currentTimeMillis());
        
        session.sendMessage(new TextMessage(response.toString()));
        logger.info("Sent CONNECTION_ESTABLISHED to admin: {}", adminId);
        
        // Send list of active users to the admin
        sendActiveUsersToAdmin(session);
        
        // For each online user, send a USER_CONNECTED notification to this admin
        // to ensure the user list is updated
        for (Map.Entry<String, WebSocketSession> entry : userSessions.entrySet()) {
            if (entry.getValue().isOpen()) {
                String userId = entry.getKey();
                String sessionId = userIdToSessionId.get(userId);
                
                // Try to get username from database if sessionId exists
                String username = "User " + userId; // Default username
                if (sessionId != null) {
                    try {
                        ChatSession chatSession = chatService.getActiveChatSession(userId).orElse(null);
                        if (chatSession != null && chatSession.getUserName() != null) {
                            username = chatSession.getUserName();
                        }
                    } catch (Exception e) {
                        logger.error("Error getting username for user {}: {}", userId, e.getMessage());
                    }
                }
                
                ObjectNode userConnectedNotification = objectMapper.createObjectNode();
                userConnectedNotification.put("type", "USER_CONNECTED");
                userConnectedNotification.put("userId", userId);
                userConnectedNotification.put("username", username);
                userConnectedNotification.put("timestamp", System.currentTimeMillis());
                if (sessionId != null) {
                    userConnectedNotification.put("sessionId", sessionId);
                }
                
                logger.info("Sending USER_CONNECTED notification for user {} to admin {}", userId, adminId);
                session.sendMessage(new TextMessage(userConnectedNotification.toString()));
                
                // If sessionId exists, check for pending messages that need a response
                if (sessionId != null) {
                    try {
                        List<ChatMessage> messages = 
                            chatService.getMessagesByChatSession(sessionId);
                        
                        if (!messages.isEmpty()) {
                            // Find the last user message
                            for (int i = messages.size() - 1; i >= 0; i--) {
                                ChatMessage lastMsg = messages.get(i);
                                if (lastMsg.getSenderType() == ChatMessage.SenderType.USER) {
                                    // Send notification about pending message
                                    ObjectNode pendingMsg = objectMapper.createObjectNode();
                                    pendingMsg.put("type", "PENDING_MESSAGES");
                                    pendingMsg.put("userId", userId);
                                    pendingMsg.put("username", username);
                                    pendingMsg.put("sessionId", sessionId);
                                    pendingMsg.put("lastMessage", lastMsg.getContent());
                                    pendingMsg.put("timestamp", System.currentTimeMillis());
                                    
                                    logger.info("Sending pending message notification for user {} to admin {}", userId, adminId);
                                    session.sendMessage(new TextMessage(pendingMsg.toString()));
                                    break;
                                }
                            }
                        }
                    } catch (Exception e) {
                        logger.error("Error getting messages for session {}: {}", sessionId, e.getMessage());
                    }
                }
            }
        }
    }
    
    private void handleDisconnect(WebSocketSession session) {
        // This method is now deprecated - using afterConnectionClosed instead
        String userId = findUserIdBySession(session);
        String adminId = findAdminIdBySession(session);
        
        if (userId != null) {
            logger.info("User disconnected: {}", userId);
            userSessions.remove(userId);
            
            // Notify all admins about user disconnect
            notifyAdminsUserDisconnected(userId);
        } else if (adminId != null) {
            logger.info("Admin disconnected: {}", adminId);
            adminSessions.remove(adminId);
        }
    }
    
    private String findUserIdBySession(WebSocketSession session) {
        for (Map.Entry<String, WebSocketSession> entry : userSessions.entrySet()) {
            if (entry.getValue().getId().equals(session.getId())) {
                return entry.getKey();
            }
        }
        return null;
    }
    
    private String findAdminIdBySession(WebSocketSession session) {
        for (Map.Entry<String, WebSocketSession> entry : adminSessions.entrySet()) {
            if (entry.getValue().getId().equals(session.getId())) {
                return entry.getKey();
            }
        }
        return null;
    }
    
    private void notifyAdminsUserDisconnected(String userId) {
        logger.info("Notifying admins that user {} has disconnected", userId);
        logger.info("Current number of admin sessions: {}", adminSessions.size());
        
        if (adminSessions.isEmpty()) {
            logger.warn("No admin sessions available to notify about user disconnect");
            return;
        }
        
        int notificationsSent = 0;
        
        for (Map.Entry<String, WebSocketSession> entry : adminSessions.entrySet()) {
            String adminId = entry.getKey();
            WebSocketSession adminSession = entry.getValue();
            
            if (adminSession != null && adminSession.isOpen()) {
                try {
                    ObjectNode notification = objectMapper.createObjectNode();
                    notification.put("type", "USER_DISCONNECTED");
                    notification.put("userId", userId);
                    notification.put("timestamp", System.currentTimeMillis());
                    
                    String notificationJson = notification.toString();
                    logger.info("Sending USER_DISCONNECTED notification to admin {}: {}", adminId, notificationJson);
                    adminSession.sendMessage(new TextMessage(notificationJson));
                    notificationsSent++;
                } catch (IOException e) {
                    logger.error("Error notifying admin {} about user disconnect: {}", adminId, e.getMessage());
                    // Remove invalid session
                    adminSessions.remove(adminId);
                }
            } else {
                logger.warn("Admin session for {} is null or not open, removing from sessions map", adminId);
                adminSessions.remove(adminId);
            }
        }
        
        logger.info("Successfully sent user disconnect notification to {} admin(s)", notificationsSent);
    }
    
    private void notifyAdminsAboutNewUser(String userId, String username, String sessionId) throws IOException {
        logger.info("Notifying admins about new user: {} ({})", username, userId);
        logger.info("Number of admin sessions: {}", adminSessions.size());
        
        for (Map.Entry<String, WebSocketSession> entry : adminSessions.entrySet()) {
            String adminId = entry.getKey();
            WebSocketSession adminSession = entry.getValue();
            
            if (adminSession.isOpen()) {
                ObjectNode notification = objectMapper.createObjectNode();
                notification.put("type", "USER_CONNECTED");
                notification.put("userId", userId);
                notification.put("username", username);
                notification.put("timestamp", System.currentTimeMillis());
                notification.put("sessionId", sessionId);
                
                logger.info("Sending notification to admin: {}", adminId);
                adminSession.sendMessage(new TextMessage(notification.toString()));
            } else {
                logger.warn("Admin session for {} is not open", adminId);
            }
        }
        
        if (adminSessions.isEmpty()) {
            logger.warn("No admin sessions available to receive new user notification");
        }
    }
    
    private void sendActiveUsersToAdmin(WebSocketSession adminSession) throws IOException {
        ObjectNode activeUsersNode = objectMapper.createObjectNode();
        activeUsersNode.put("type", "ACTIVE_USERS");
        
        // Build array of active users
        com.fasterxml.jackson.databind.node.ArrayNode usersArray = objectMapper.createArrayNode();
        
        // Get active sessions by iterating through userSessions map (which uses sessionId as key)
        for (Map.Entry<String, WebSocketSession> entry : userSessions.entrySet()) {
            String sessionId = entry.getKey();
            WebSocketSession userSession = entry.getValue();
            
            if (userSession != null && userSession.isOpen()) {
                // Find userId for this sessionId
                String userId = null;
                String username = "Unknown User";
                
                // Look up userId from sessionId mapping
                for (Map.Entry<String, String> userEntry : userIdToSessionId.entrySet()) {
                    if (sessionId.equals(userEntry.getValue())) {
                        userId = userEntry.getKey();
                        break;
                    }
                }
                
                // If we found a userId, try to get the username from the database
                if (userId != null) {
                    try {
                        Optional<ChatSession> chatSession = chatSessionRepository.findById(sessionId);
                        if (chatSession.isPresent()) {
                            username = chatSession.get().getUserName();
                        }
                    } catch (Exception e) {
                        logger.error("Error getting username for sessionId {}: {}", sessionId, e.getMessage());
                    }
                    
                    // Create user node
                    ObjectNode userNode = objectMapper.createObjectNode();
                    userNode.put("userId", userId);
                    userNode.put("username", username);
                    userNode.put("connected", true);
                    userNode.put("sessionId", sessionId);
                    
                    usersArray.add(userNode);
                }
            }
        }
        
        activeUsersNode.set("activeUsers", usersArray);
        activeUsersNode.put("timestamp", System.currentTimeMillis());
        
        logger.info("Sending active users to admin: {} users", usersArray.size());
        adminSession.sendMessage(new TextMessage(activeUsersNode.toString()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        logger.info("WebSocket connection closed: {} with status {}", session.getId(), status);
        
        // Check if this is a user session using the webSocketSessionToSessionId map
        String sessionId = webSocketSessionToSessionId.get(session.getId());
        if (sessionId != null) {
            logger.info("Found chat session ID {} for closed WebSocket session", sessionId);
            
            // Remove the WebSocket session but keep the chat session
            userSessions.remove(sessionId);
            webSocketSessionToSessionId.remove(session.getId());
            
            // Find userId associated with this sessionId
            String userId = null;
            for (Map.Entry<String, String> entry : userIdToSessionId.entrySet()) {
                if (sessionId.equals(entry.getValue())) {
                    userId = entry.getKey();
                    break;
                }
            }
            
            if (userId != null) {
                logger.info("User {} with session {} disconnected", userId, sessionId);
                // Note: we don't remove from userIdToSessionId to keep the mapping for reconnections
                
                // Notify all admins about user disconnect
                notifyAdminsUserDisconnected(userId);
            } else {
                logger.warn("Could not find userId for sessionId {} on disconnect", sessionId);
            }
            
            return;
        }
        
        // Check if this is an admin session
        String adminId = findAdminIdBySession(session);
        if (adminId != null) {
            logger.info("Admin disconnected: {}", adminId);
            adminSessions.remove(adminId);
            
            // Notify users (optional - might not be necessary as other admins can still respond)
            for (Map.Entry<String, WebSocketSession> entry : userSessions.entrySet()) {
                WebSocketSession userSession = entry.getValue();
                String chatSessionId = entry.getKey();
                
                if (userSession != null && userSession.isOpen()) {
                    // Send notification of admin disconnect
                    ObjectNode adminDisconnectNotification = objectMapper.createObjectNode();
                    adminDisconnectNotification.put("type", "ADMIN_DISCONNECT");
                    adminDisconnectNotification.put("adminId", adminId);
                    adminDisconnectNotification.put("sessionId", chatSessionId);
                    adminDisconnectNotification.put("message", "Support agent has disconnected. Your chat will be available to other support agents.");
                    adminDisconnectNotification.put("timestamp", System.currentTimeMillis());
                    
                    try {
                        userSession.sendMessage(new TextMessage(adminDisconnectNotification.toString()));
                        logger.info("Sent admin disconnect notification to session {}", chatSessionId);
                    } catch (IOException e) {
                        logger.error("Error sending admin disconnect notification to session {}: {}", chatSessionId, e.getMessage());
                    }
                }
            }
            
            return;
        }
        
        logger.warn("Could not identify session type for closed WebSocket session: {}", session.getId());
    }
    
    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        logger.error("WebSocket transport error: {}", exception.getMessage(), exception);
    }

    // Handle explicit session ending
    private void handleEndChat(WebSocketSession session, JsonNode jsonNode) throws IOException {
        String userId = getSafeNodeValue(jsonNode, "userId", null);
        String sessionId = getSafeNodeValue(jsonNode, "sessionId", null);
        
        if (userId == null || sessionId == null) {
            logger.error("Missing required fields in END_CHAT message");
            ObjectNode errorMsg = objectMapper.createObjectNode();
            errorMsg.put("type", "ERROR");
            errorMsg.put("message", "Missing required fields in END_CHAT message");
            session.sendMessage(new TextMessage(errorMsg.toString()));
            return;
        }
        
        logger.info("User {} requested to end chat session {}", userId, sessionId);
        
        try {
            // End the chat session by changing its status to ENDED
            chatService.updateSessionStatus(sessionId, "ENDED");
            
            // Remove the session from our tracking map
            userIdToSessionId.remove(userId);
            
            // Add system message that chat was ended by user
            chatService.saveMessage(
                "Chat session was ended by the user.",
                "SYSTEM",
                "System",
                null,
                ChatMessage.SenderType.SYSTEM,
                sessionId
            );
            
            // Notify all admins that the chat was ended
            for (Map.Entry<String, WebSocketSession> entry : adminSessions.entrySet()) {
                String adminId = entry.getKey();
                WebSocketSession adminSession = entry.getValue();
                
                if (adminSession != null && adminSession.isOpen()) {
                    ObjectNode chatEndedNotification = objectMapper.createObjectNode();
                    chatEndedNotification.put("type", "CHAT_ENDED");
                    chatEndedNotification.put("userId", userId);
                    chatEndedNotification.put("sessionId", sessionId);
                    chatEndedNotification.put("timestamp", System.currentTimeMillis());
                    
                    adminSession.sendMessage(new TextMessage(chatEndedNotification.toString()));
                    logger.info("Notified admin {} that chat session {} was ended", adminId, sessionId);
                }
            }
            
            // Confirm to the user
            ObjectNode confirmEnd = objectMapper.createObjectNode();
            confirmEnd.put("type", "CHAT_ENDED");
            confirmEnd.put("sessionId", sessionId);
            confirmEnd.put("message", "Chat session has been ended.");
            confirmEnd.put("timestamp", System.currentTimeMillis());
            
            session.sendMessage(new TextMessage(confirmEnd.toString()));
            logger.info("Sent chat end confirmation to user {}", userId);
            
        } catch (Exception e) {
            logger.error("Error ending chat session {}: {}", sessionId, e.getMessage(), e);
            ObjectNode errorMsg = objectMapper.createObjectNode();
            errorMsg.put("type", "ERROR");
            errorMsg.put("message", "Failed to end chat: " + e.getMessage());
            session.sendMessage(new TextMessage(errorMsg.toString()));
        }
    }

    // Method to broadcast message to all admin sessions
    private void broadcastMessageToAdmins(ObjectNode message, String senderId) throws IOException {
        for (Map.Entry<String, WebSocketSession> entry : adminSessions.entrySet()) {
            WebSocketSession adminSession = entry.getValue();
            if (adminSession != null && adminSession.isOpen()) {
                adminSession.sendMessage(new TextMessage(message.toString()));
            }
        }
    }

    /**
     * Notify all connected admins that a chat session has been deleted
     * 
     * @param sessionId The ID of the deleted chat session
     */
    public void notifyAdminsSessionDeleted(String sessionId) {
        logger.info("Notifying admins about deleted chat session: {}", sessionId);
        
        Map<String, Object> message = new HashMap<>();
        message.put("type", "SESSION_DELETED");
        message.put("sessionId", sessionId);
        message.put("timestamp", System.currentTimeMillis());
        
        String jsonMessage = null;
        try {
            jsonMessage = objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException e) {
            logger.error("Error creating session deleted notification: {}", e.getMessage());
            return;
        }
        
        // Gửi thông báo cho tất cả admin
        for (Map.Entry<String, WebSocketSession> entry : adminSessions.entrySet()) {
            try {
                WebSocketSession adminSession = entry.getValue();
                if (adminSession.isOpen()) {
                    adminSession.sendMessage(new TextMessage(jsonMessage));
                    logger.debug("Sent session deleted notification to admin: {}", entry.getKey());
                }
            } catch (IOException e) {
                logger.error("Error sending session deleted notification to admin: {}", e.getMessage());
            }
        }
        
        // Gửi thông báo cho user nếu còn kết nối
        WebSocketSession userSession = userSessions.get(sessionId);
        if (userSession != null && userSession.isOpen()) {
            try {
                userSession.sendMessage(new TextMessage(jsonMessage));
                logger.debug("Sent session deleted notification to user with session: {}", sessionId);
            } catch (IOException e) {
                logger.error("Error sending session deleted notification to user: {}", e.getMessage());
            }
        }
    }
} 