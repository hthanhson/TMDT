package com.example.tmdt.service;

import com.example.tmdt.model.Category;
import com.example.tmdt.model.Product;
import com.example.tmdt.repository.CategoryRepository;
import com.example.tmdt.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityNotFoundException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Autowired
    public CategoryService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + id));
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category categoryDetails) {
        Category category = getCategoryById(id);
        
        category.setName(categoryDetails.getName());
        category.setDescription(categoryDetails.getDescription());
        category.setImageUrl(categoryDetails.getImageUrl());
        category.setDisplayOrder(categoryDetails.getDisplayOrder());
        category.setIsActive(categoryDetails.getIsActive());
        
        if (categoryDetails.getParent() != null) {
            category.setParent(categoryDetails.getParent());
        }
        
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        
        // Check if category has products
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new IllegalStateException("Cannot delete category with associated products");
        }
        
        // Remove parent reference from subcategories
        if (category.getSubCategories() != null && !category.getSubCategories().isEmpty()) {
            category.getSubCategories().forEach(subcategory -> subcategory.setParent(null));
        }
        
        categoryRepository.delete(category);
    }

    public List<Object> getProductsByCategory(Long categoryId) {
        Category category = getCategoryById(categoryId);
        return category.getProducts().stream()
                .map(product -> {
                    // Convert to simpler representation if needed
                    return product;
                })
                .collect(Collectors.toList());
    }
} 