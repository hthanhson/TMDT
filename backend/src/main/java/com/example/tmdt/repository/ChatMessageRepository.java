package com.example.tmdt.repository;

import com.example.tmdt.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatSessionIdOrderByCreatedAtAsc(String chatSessionId);
    
    @Query("SELECT m FROM ChatMessage m WHERE m.senderId = ?1 OR m.receiverId = ?1 ORDER BY m.createdAt DESC")
    List<ChatMessage> findByUserIdOrderByCreatedAtDesc(String userId);
    
    List<ChatMessage> findBySenderIdAndReceiverIdOrderByCreatedAtAsc(String senderId, String receiverId);

    List<ChatMessage> findByChatSessionIdAndReadIsFalse(String chatSessionId);
    
    // Count unread messages in a session
    long countByChatSessionIdAndReadIsFalse(String chatSessionId);
    
    // Find most recent message in a chat session
    @Query("SELECT m FROM ChatMessage m WHERE m.chatSessionId = ?1 ORDER BY m.createdAt DESC")
    List<ChatMessage> findLatestByChatSessionId(String chatSessionId);
} 