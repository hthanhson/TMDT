package com.example.tmdt.repository;

import com.example.tmdt.model.ChatSession;
import com.example.tmdt.model.ChatSession.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, String> {
    
    // Find active sessions for a user
    Optional<ChatSession> findByUserIdAndStatus(String userId, SessionStatus status);
    
    // Find all sessions for a user sorted by start time (descending)
    List<ChatSession> findByUserIdOrderByStartedAtDesc(String userId);
    
    // Find all active sessions
    List<ChatSession> findByStatusOrderByStartedAtDesc(SessionStatus status);
    
    // Find all sessions with a specific status (using query)
    @Query("SELECT c FROM ChatSession c WHERE c.status = ?1 ORDER BY c.startedAt DESC")
    List<ChatSession> findByStatusOrderByStartedAtDescWithQuery(SessionStatus status);
    
    // Count sessions with specific status
    long countByStatus(SessionStatus status);
    
    // Find distinct statuses in the database
    @Query("SELECT DISTINCT c.status FROM ChatSession c")
    List<SessionStatus> findDistinctStatus();
} 