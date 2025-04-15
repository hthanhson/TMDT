package com.example.tmdt.model;

import javax.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "chat_sessions")
public class ChatSession {

    @Id
    @Column(nullable = false)
    private String id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private SessionStatus status;

    @Column(name = "last_message", length = 500)
    private String lastMessage;

    @Column(name = "unread_count")
    private Integer unreadCount = 0;

    @PrePersist
    public void prePersist() {
        startedAt = LocalDateTime.now();
        if (status == null) {
            status = SessionStatus.ACTIVE;
        }
        if (unreadCount == null) {
            unreadCount = 0;
        }
    }

    public enum SessionStatus {
        ACTIVE, ENDED;
        
        @Override
        public String toString() {
            return this.name();
        }
    }
    
    // Method for debugging
    public String getStatusAsString() {
        return status != null ? status.name() : "NULL";
    }
} 