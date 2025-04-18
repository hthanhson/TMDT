package com.example.tmdt.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@Entity
@Table(name = "VNPayStatus")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VNPayStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String status;
    @Column
    private String Message;
    @Column
    private String url;
}
