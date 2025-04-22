package com.example.tmdt.model;

import javax.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductImage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;
    
    @Column(name = "url", nullable = false)
    private String imageUrl;
    
    @Column(name = "display_order")
    private Integer displayOrder;
    
    @Column(name="created_at")
    private String alt;
    
    // Convenience constructor
    public ProductImage(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    
    // Getters and Setters for backward compatibility
    public String getUrl() {
        return imageUrl;
    }
    
    public void setUrl(String url) {
        this.imageUrl = url;
    }
} 