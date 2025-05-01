package com.example.tmdt.repository;

import com.example.tmdt.model.User;
import com.example.tmdt.model.Role.ERole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Boolean existsByUsername(String username);
    
    Boolean existsByEmail(String email);
    
    // Tìm tất cả người dùng có một vai trò cụ thể - cập nhật để sử dụng enum ERole
    List<User> findByRoles_Name(ERole roleName);
} 