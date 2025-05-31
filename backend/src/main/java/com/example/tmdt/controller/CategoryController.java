package com.example.tmdt.controller;

import com.example.tmdt.model.Category;
import com.example.tmdt.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CategoryController {

    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllActiveCategories();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/categories/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        Category category = categoryService.getCategoryById(id);
        return ResponseEntity.ok(category);
    }

//    @PostMapping("/admin/categories")
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<Category> createCategory(@Valid @RequestBody Category category) {
//        Category createdCategory = categoryService.createCategory(category);
//        return new ResponseEntity<>(createdCategory, HttpStatus.CREATED);
//    }
//
//    @PutMapping("/admin/categories/{id}")
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<Category> updateCategory(
//            @PathVariable Long id,
//            @Valid @RequestBody Category categoryDetails) {
//        Category updatedCategory = categoryService.updateCategory(id, categoryDetails);
//        return ResponseEntity.ok(updatedCategory);
//    }
//
//    @DeleteMapping("/admin/categories/{id}")
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
//        categoryService.deleteCategory(id);
//        return ResponseEntity.noContent().build();
//    }

    @GetMapping("/categories/{id}/products")
    public ResponseEntity<List<Object>> getProductsByCategory(@PathVariable Long id) {
        List<Object> products = categoryService.getProductsByCategory(id);
        return ResponseEntity.ok(products);
    }
    
    // Add new endpoint for admin to get all categories including inactive ones
//    @PostMapping("/admin/categories/all")
//    @PreAuthorize("hasRole('ADMIN')")
//    public ResponseEntity<List<Category>> getAllCategoriesAdmin(@RequestBody(required = false) Map<String, Object> params) {
//        // Log request for debugging
//        System.out.println("Fetching all categories for admin with params: " + params);
//
//        // Get all categories including inactive ones
//        List<Category> allCategories = categoryService.getAllCategories();
//
//        System.out.println("Found " + allCategories.size() + " categories in total");
//
//        // Log how many are inactive
//        long inactiveCount = allCategories.stream()
//                .filter(c -> c.getIsActive() != null && !c.getIsActive())
//                .count();
//        System.out.println("Found " + inactiveCount + " inactive categories");
//
//        return ResponseEntity.ok(allCategories);
//    }
} 