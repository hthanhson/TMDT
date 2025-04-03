package com.example.tmdt.model;

import java.time.LocalDateTime;

import javax.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "review_media")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false)
    private MediaType type;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public enum MediaType {
        IMAGE, VIDEO, OTHER
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Convenience methods to set type from string
    public void setType(String typeString) {
        try {
            this.type = MediaType.valueOf(typeString);
        } catch (IllegalArgumentException e) {
            // Fallback to default behavior
            if ("IMAGE".equals(typeString)) {
                this.type = MediaType.IMAGE;
            } else if ("VIDEO".equals(typeString)) {
                this.type = MediaType.VIDEO;
            } else {
                this.type = MediaType.OTHER;
            }
        }
    }
} 