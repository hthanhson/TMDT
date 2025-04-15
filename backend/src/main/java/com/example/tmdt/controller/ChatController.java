package com.example.tmdt.controller;

import com.example.tmdt.model.ChatMessage;
import com.example.tmdt.model.ChatSession;
import com.example.tmdt.model.User;
import com.example.tmdt.service.ChatService;
import com.example.tmdt.service.UserService;
import com.example.tmdt.websocket.ChatWebSocketHandler;
import com.example.tmdt.repository.ChatMessageRepository;
import com.example.tmdt.repository.ChatSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ChatController {

    private final Logger logger = LoggerFactory.getLogger(ChatController.class);
    private final ChatService chatService;
    private final UserService userService;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatWebSocketHandler chatWebSocketHandler;

    @Autowired
    public ChatController(ChatService chatService, 
                         UserService userService, 
                         ChatMessageRepository chatMessageRepository,
                         ChatSessionRepository chatSessionRepository,
                         ChatWebSocketHandler chatWebSocketHandler) {
        this.chatService = chatService;
        this.userService = userService;
        this.chatMessageRepository = chatMessageRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.chatWebSocketHandler = chatWebSocketHandler;
    }

    /**
     * Get active chat sessions
     */
    @GetMapping("/sessions/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ChatSession>> getActiveChatSessions() {
        logger.info("Getting active chat sessions");
        List<ChatSession> sessions = chatService.getActiveChatSessions();
        logger.info("Found {} active sessions", sessions.size());
        return ResponseEntity.ok(sessions);
    }

    /**
     * Get user chat history
     */
    @GetMapping("/sessions/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public ResponseEntity<List<ChatSession>> getUserChatHistory(@PathVariable String userId) {
        logger.info("Getting chat sessions for user {}", userId);
        List<ChatSession> sessions = chatService.getUserChatHistory(userId);
        logger.info("Found {} sessions for user {}", sessions.size(), userId);
        return ResponseEntity.ok(sessions);
    }

    /**
     * Get messages by chat session
     */
    @GetMapping("/messages/session/{sessionId}")
    public ResponseEntity<List<ChatMessage>> getMessagesByChatSession(@PathVariable String sessionId) {
        logger.info("Getting messages for session {}", sessionId);
        List<ChatMessage> messages = chatService.getMessagesByChatSession(sessionId);
        logger.info("Found {} messages for session {}", messages.size(), sessionId);
        return ResponseEntity.ok(messages);
    }

    /**
     * End chat session (admin only)
     */
    @PostMapping("/sessions/{sessionId}/end")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> endChatSession(@PathVariable String sessionId) {
        logger.info("Ending chat session {}", sessionId);
        chatService.endChatSession(sessionId);
        logger.info("Chat session {} ended", sessionId);
        return ResponseEntity.ok().build();
    }

    /**
     * Get active chat session for user or create new one
     */
    @GetMapping("/sessions/user/{userId}/active")
    public ResponseEntity<?> getActiveChatSession(@PathVariable String userId) {
        logger.info("Getting active chat session for user {}", userId);
        Optional<ChatSession> session = chatService.getActiveChatSession(userId);
        
        if (session.isPresent()) {
            logger.info("Found active session {} for user {}", session.get().getId(), userId);
            return ResponseEntity.ok(session.get());
        } else {
            // No active session found, create a new one
            try {
                logger.info("No active session found for user {}, creating new session", userId);
                
                // Get user name from user service
                String userName;
                try {
                    // Convert userId to Long for UserService
                    Long userIdLong = Long.parseLong(userId);
                    User user = userService.getUserById(userIdLong);
                    userName = user.getFullName() != null && !user.getFullName().isEmpty() 
                        ? user.getFullName() 
                        : user.getUsername();
                    logger.info("Found user name for userId {}: {}", userId, userName);
                } catch (NumberFormatException | UsernameNotFoundException e) {
                    // Default username if user not found or ID is not a number
                    userName = "User " + userId;
                    logger.warn("Could not find user for userId {}, using default name: {}", userId, userName);
                }
                
                // Create a new chat session
                ChatSession newSession = chatService.createChatSession(userId, userName);
                logger.info("Created new chat session {} for user {}", newSession.getId(), userId);
                
                return ResponseEntity.ok(newSession);
            } catch (Exception e) {
                logger.error("Error creating new chat session for user {}: {}", userId, e.getMessage());
                return ResponseEntity.status(500).body("Error creating chat session: " + e.getMessage());
            }
        }
    }

    /**
     * Create a new chat session
     */
    @PostMapping("/sessions")
    public ResponseEntity<ChatSession> createChatSession(@RequestBody Map<String, String> payload) {
        if (!payload.containsKey("userId")) {
            logger.error("Missing required field 'userId' in chat session creation request");
            return ResponseEntity.badRequest().build();
        }
        
        // Only create session if explicitly requested for support
        boolean requestSupport = Boolean.parseBoolean(payload.getOrDefault("requestSupport", "false"));
        if (!requestSupport) {
            logger.info("Session creation not requested for support. Returning error.");
            return ResponseEntity.badRequest().body(null);
        }
        
        String userId = payload.get("userId");
        logger.info("Creating chat session for user {}", userId);
        
        // Check if this is an anonymous user
        boolean isAnonymous = Boolean.parseBoolean(payload.getOrDefault("isAnonymous", "false"));
        logger.info("User {} is anonymous: {}", userId, isAnonymous);
        
        // Get username from payload or use default
        String userName = payload.get("username");
        if (userName == null || userName.isEmpty()) {
            // For anonymous users, use a guest name
            if (isAnonymous) {
                userName = "Guest " + userId.substring(Math.max(0, userId.length() - 8));
                logger.info("Using anonymous name for userId {}: {}", userId, userName);
            } else {
                // For authenticated users, try to get from user service
                try {
                    // Convert userId to Long for UserService
                    Long userIdLong = Long.parseLong(userId);
                    User user = userService.getUserById(userIdLong);
                    userName = user.getFullName() != null && !user.getFullName().isEmpty() 
                        ? user.getFullName() 
                        : user.getUsername();
                    logger.info("Found user name for userId {}: {}", userId, userName);
                } catch (NumberFormatException | UsernameNotFoundException e) {
                    // Use default if user not found or ID is not a number
                    userName = "User " + userId;
                    logger.warn("Could not find user for userId {}, using default name: {}", userId, userName);
                }
            }
        }
        
        try {
            ChatSession session = chatService.createChatSession(userId, userName);
            logger.info("Created chat session {} for user {} (anonymous: {})", session.getId(), userId, isAnonymous);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            logger.error("Error creating chat session for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Save a message to the database
     */
    @PostMapping("/messages")
    public ResponseEntity<ChatMessage> saveMessage(@RequestBody Map<String, String> payload) {
        logger.debug("Saving message with payload: {}", payload);
        
        // Validate required fields
        if (!payload.containsKey("content")) {
            logger.error("Missing required field 'content' in chat message");
            return ResponseEntity.badRequest().body(null);
        }
        
        if (!payload.containsKey("senderId")) {
            logger.error("Missing required field 'senderId' in chat message");
            return ResponseEntity.badRequest().body(null);
        }
        
        if (!payload.containsKey("chatSessionId")) {
            logger.error("Missing required field 'chatSessionId' in chat message");
            return ResponseEntity.badRequest().body(null);
        }
        
        String content = payload.get("content");
        String senderId = payload.get("senderId");
        String chatSessionId = payload.get("chatSessionId");
        
        // Default values for optional fields
        String senderName = payload.getOrDefault("senderName", "User " + senderId);
        ChatMessage.SenderType senderType;
        
        try {
            senderType = ChatMessage.SenderType.valueOf(
                payload.getOrDefault("senderType", "USER").toUpperCase()
            );
        } catch (IllegalArgumentException e) {
            logger.error("Invalid senderType: {}", payload.get("senderType"));
            senderType = ChatMessage.SenderType.USER;
        }
        
        try {
            // Verify the session exists
            if (!chatSessionRepository.existsById(chatSessionId)) {
                logger.error("Chat session with ID {} does not exist", chatSessionId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(null);
            }
            
            // Save message
            ChatMessage message = chatService.saveMessage(
                content, 
                senderId, 
                senderName, 
                null, // receiverId can be null for normal messages
                senderType, 
                chatSessionId
            );
            
            logger.info("Message saved successfully with ID {}", message.getId());

            // Lưu ý: Tin nhắn đã được gửi qua WebSocket bởi ChatWebSocketHandler
            // Controller chỉ cần lưu vào database và trả về kết quả
            
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            logger.error("Error saving message: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    /**
     * Save a system message
     */
    @PostMapping("/messages/system")
    public ResponseEntity<ChatMessage> saveSystemMessage(@RequestBody Map<String, String> payload) {
        logger.info("Received system message payload: {}", payload);
        
        // Validate essential fields
        if (!payload.containsKey("content")) {
            logger.error("Missing required field 'content' in system message");
            return ResponseEntity.badRequest().body(null);
        }
        
        if (!payload.containsKey("chatSessionId")) {
            logger.error("Missing required field 'chatSessionId' in system message");
            return ResponseEntity.badRequest().body(null);
        }

        String sessionId = payload.get("chatSessionId");
        String content = payload.get("content");
        // Use userId from payload or default to null (system message doesn't require a recipient)
        String userId = payload.getOrDefault("userId", null);
        
        logger.info("Saving system message. Content: {}, SessionId: {}, UserId: {}", 
            content.substring(0, Math.min(20, content.length())), 
            sessionId,
            userId);

        try {
            ChatMessage message = chatService.saveMessage(
                    content,
                    "SYSTEM",
                    "System",
                    userId,
                    ChatMessage.SenderType.SYSTEM,
                    sessionId
            );

            logger.info("System message saved successfully with id {}", message.getId());
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            logger.error("Error saving system message: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Update session status
     */
    @PutMapping("/sessions/{sessionId}/status")
    public ResponseEntity<?> updateSessionStatus(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> payload) {
        
        if (!payload.containsKey("status")) {
            return ResponseEntity.badRequest().body("Status field is required");
        }
        
        String status = payload.get("status");
        logger.info("Updating chat session {} status to {}", sessionId, status);
        
        try {
            ChatSession updatedSession = chatService.updateSessionStatus(sessionId, status);
            logger.info("Chat session {} status updated to {}", sessionId, status);
            return ResponseEntity.ok(updatedSession);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid status value: {}", status);
            return ResponseEntity.badRequest().body("Invalid status value: " + status);
        } catch (Exception e) {
            logger.error("Error updating chat session status", e);
            return ResponseEntity.status(500).body("Error updating chat session status: " + e.getMessage());
        }
    }

    /**
     * Get all chat sessions (admin only)
     */
    @GetMapping("/sessions/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ChatSession>> getAllChatSessions() {
        logger.info("Getting all chat sessions");
        List<ChatSession> sessions = chatService.getAllChatSessions();
        logger.info("Found {} total sessions", sessions.size());
        return ResponseEntity.ok(sessions);
    }

    /**
     * Mark all messages in a session as read
     */
    @PutMapping("/sessions/{sessionId}/read")
    public ResponseEntity<Void> markSessionAsRead(@PathVariable String sessionId) {
        logger.info("Marking all messages in session {} as read", sessionId);
        chatService.markSessionAsRead(sessionId);
        logger.info("All messages in session {} marked as read", sessionId);
        return ResponseEntity.ok().build();
    }

    /**
     * End a chat session (accessible by users and admins)
     */
    @PutMapping("/sessions/{sessionId}/end")
    public ResponseEntity<Void> endUserChatSession(@PathVariable String sessionId) {
        logger.info("User requested to end chat session {}", sessionId);
        
        try {
            chatService.updateSessionStatus(sessionId, "ENDED");
            logger.info("Chat session {} ended by user request", sessionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error ending chat session {}: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * Get a specific chat session by ID
     */
    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<?> getChatSessionById(@PathVariable String sessionId) {
        try {
            Optional<ChatSession> session = chatService.findChatSessionById(sessionId);
            if (session.isPresent()) {
                return ResponseEntity.ok(session.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Chat session not found");
            }
        } catch (Exception e) {
            logger.error("Error getting chat session by ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error getting chat session by ID: " + e.getMessage());
        }
    }

    /**
     * Delete a chat session and all its associated messages
     * @param sessionId The ID of the chat session to delete
     * @return Success message if deleted, error message if not found or error occurs
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> deleteChatSession(@PathVariable String sessionId) {
        logger.info("Received request to delete chat session with ID: {}", sessionId);
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean deleted = chatService.deleteChatSession(sessionId);
            if (deleted) {
                logger.info("Successfully deleted chat session with ID: {}", sessionId);
                response.put("success", true);
                response.put("message", "Chat session deleted successfully");
                
                // Notify admins about the deleted session
                chatWebSocketHandler.notifyAdminsSessionDeleted(sessionId);
                
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to delete chat session with ID: {}", sessionId);
                response.put("success", false);
                response.put("message", "Failed to delete chat session");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (Exception e) {
            logger.error("Error deleting chat session with ID: {}", sessionId, e);
            response.put("success", false);
            response.put("message", "Error deleting chat session: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
} 