package com.example.tmdt.service;

import com.example.tmdt.model.ChatMessage;
import com.example.tmdt.model.ChatSession;
import com.example.tmdt.repository.ChatMessageRepository;
import com.example.tmdt.repository.ChatSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service class for managing chat sessions and messages
 */
@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    /**
     * Create a new chat session for a user
     */
    public ChatSession createChatSession(String userId, String userName) {
        // Check if user already has an active session
        Optional<ChatSession> existingSession = chatSessionRepository.findByUserIdAndStatus(
                userId, ChatSession.SessionStatus.ACTIVE);
        
        if (existingSession.isPresent()) {
            return existingSession.get();
        }
        
        // Create a new chat session
        ChatSession chatSession = ChatSession.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .userName(userName)
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();
        
        return chatSessionRepository.save(chatSession);
    }

    /**
     * End a chat session
     */
    public void endChatSession(String sessionId) {
        chatSessionRepository.findById(sessionId).ifPresent(session -> {
            // Change status to ENDED
            session.setStatus(ChatSession.SessionStatus.ENDED);

            // Set end time
            session.setEndedAt(LocalDateTime.now());

            // Add log
            logger.info("Ending chat session {} and changing status to ENDED", sessionId);

            chatSessionRepository.save(session);
        });
    }

    /**
     * Save a message
     */
    public ChatMessage saveMessage(String content, String senderId, String senderName, 
                                  String receiverId, ChatMessage.SenderType senderType, 
                                  String sessionId) {
        ChatMessage message = ChatMessage.builder()
                .content(content)
                .senderId(senderId)
                .senderName(senderName)
                .receiverId(receiverId)
                .senderType(senderType)
                .chatSessionId(sessionId)
                .build();
        
        ChatMessage savedMessage = chatMessageRepository.save(message);
        
        // Update the lastMessage field in the ChatSession
        if (sessionId != null) {
            chatSessionRepository.findById(sessionId).ifPresent(session -> {
                session.setLastMessage(content);
                
                // Increment unread count for new messages (except system messages)
                if (senderType != ChatMessage.SenderType.SYSTEM) {
                    int currentUnread = session.getUnreadCount() != null ? session.getUnreadCount() : 0;
                    session.setUnreadCount(currentUnread + 1);
                }
                
                chatSessionRepository.save(session);
                logger.info("Updated lastMessage for session {}: {}", sessionId, content);
            });
        }
        
        return savedMessage;
    }

    /**
     * Get messages by chat session
     */
    public List<ChatMessage> getMessagesByChatSession(String sessionId) {
        return chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId);
    }

    /**
     * Get the active chat session for a user, or create a new one if none exists
     */
    public Optional<ChatSession> getActiveChatSession(String userId) {
        // Try to find an existing active session
        Optional<ChatSession> existingSession = chatSessionRepository.findByUserIdAndStatus(
                userId, ChatSession.SessionStatus.ACTIVE);
        
        // Return active session if found
        if (existingSession.isPresent()) {
            return existingSession;
        }
        
        // Log all sessions for this user for debugging
        List<ChatSession> allSessions = chatSessionRepository.findByUserIdOrderByStartedAtDesc(userId);
        if (allSessions.isEmpty()) {
            logger.info("No sessions found for user {}", userId);
        } else {
            logger.info("Found {} sessions for user {}, but none are active", allSessions.size(), userId);
            for (ChatSession session : allSessions) {
                logger.info("Session {} status: {}, created: {}, ended: {}", 
                            session.getId(), session.getStatus(), 
                            session.getStartedAt(), session.getEndedAt());
            }
        }
        
        return existingSession; // Return empty Optional if no active session exists
    }

    /**
     * Get all active chat sessions
     */
    public List<ChatSession> getActiveChatSessions() {
        logger.info("Getting active chat sessions from repository");
        return chatSessionRepository.findByStatusOrderByStartedAtDesc(ChatSession.SessionStatus.ACTIVE);
    }

    /**
     * Get chat history for a user
     */
    public List<ChatSession> getUserChatHistory(String userId) {
        return chatSessionRepository.findByUserIdOrderByStartedAtDesc(userId);
    }

    /**
     * Update session status
     */
    public ChatSession updateSessionStatus(String sessionId, String statusStr) {
        // Validate the status string
        ChatSession.SessionStatus status;
        try {
            status = ChatSession.SessionStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid status value: {}", statusStr);
            throw new IllegalArgumentException("Invalid status value: " + statusStr);
        }
        
        // Find the chat session
        Optional<ChatSession> optionalSession = chatSessionRepository.findById(sessionId);
        if (!optionalSession.isPresent()) {
            logger.error("Chat session not found with ID: {}", sessionId);
            throw new IllegalArgumentException("Chat session not found with ID: " + sessionId);
        }
        
        ChatSession session = optionalSession.get();
        
        // Update the status
        session.setStatus(status);
        
        // If ending the session, set the end time
        if (status == ChatSession.SessionStatus.ENDED) {
            session.setEndedAt(LocalDateTime.now());
        }
        
        // Save and return the updated session
        logger.info("Updating chat session {} status to {}", sessionId, status);
        return chatSessionRepository.save(session);
    }
    
    /**
     * Mark all messages in a session as read
     */
    public void markSessionAsRead(String sessionId) {
        logger.info("Marking all messages in session {} as read", sessionId);
        
        // Update the unread count in the session to 0
        Optional<ChatSession> sessionOpt = chatSessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            ChatSession session = sessionOpt.get();
            session.setUnreadCount(0);
            chatSessionRepository.save(session);
            logger.info("Reset unread count for session {}", sessionId);
        }
        
        // Find all unread messages in the session and mark them as read
        List<ChatMessage> unreadMessages = chatMessageRepository.findByChatSessionIdAndReadIsFalse(sessionId);
        for (ChatMessage message : unreadMessages) {
            message.setRead(true);
            chatMessageRepository.save(message);
        }
        
        logger.info("Marked {} messages as read in session {}", unreadMessages.size(), sessionId);
    }

    /**
     * Find a chat session by ID
     */
    public Optional<ChatSession> findChatSessionById(String sessionId) {
        return chatSessionRepository.findById(sessionId);
    }
    
    /**
     * Get all chat sessions (both active and ended)
     */
    public List<ChatSession> getAllChatSessions() {
        logger.info("Getting all chat sessions from database");
        return chatSessionRepository.findAll();
    }
    
    /**
     * Delete a chat session and all its associated messages
     * @param sessionId The ID of the chat session to delete
     * @return true if the session was found and deleted, false otherwise
     */
    public boolean deleteChatSession(String sessionId) {
        logger.info("Deleting chat session {}", sessionId);
        
        Optional<ChatSession> chatSessionOpt = chatSessionRepository.findById(sessionId);
        if (!chatSessionOpt.isPresent()) {
            logger.warn("Chat session {} not found for deletion", sessionId);
            return false;
        }
        
        // Delete all messages in the session
        List<ChatMessage> messages = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId);
        if (!messages.isEmpty()) {
            logger.info("Deleting {} messages from chat session {}", messages.size(), sessionId);
            chatMessageRepository.deleteAll(messages);
        }
        
        // Delete the session
        chatSessionRepository.deleteById(sessionId);
        logger.info("Chat session {} deleted successfully", sessionId);
        return true;
    }
} 