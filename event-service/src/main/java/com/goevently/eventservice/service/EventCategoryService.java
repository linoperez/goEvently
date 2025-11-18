package com.goevently.eventservice.service;

import com.goevently.eventservice.dto.CategoryResponse;
import com.goevently.eventservice.dto.CreateCategoryRequest;
import com.goevently.eventservice.dto.UpdateCategoryRequest;
import com.goevently.eventservice.entity.EventCategory;
import com.goevently.eventservice.exception.EventException;
import com.goevently.eventservice.repository.EventCategoryRepository;
import com.goevently.eventservice.util.CategoryMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

/**
 * Service layer for handling event category-related business logic.
 * Contains methods for creating, retrieving, updating, and managing event categories.
 */
@Service
@Slf4j
public class EventCategoryService {

    private final EventCategoryRepository eventCategoryRepository;
    private final CategoryMapper categoryMapper;

    @Autowired
    public EventCategoryService(EventCategoryRepository eventCategoryRepository,
                                CategoryMapper categoryMapper) {
        this.eventCategoryRepository = eventCategoryRepository;
        this.categoryMapper = categoryMapper;
    }

    /**
     * Creates a new event category with business validation.
     * Category names must be unique.
     *
     * @param request the CreateCategoryRequest containing category details
     * @return CategoryResponse with the created category data
     * @throws EventException if validation fails or category name already exists
     */

    @CacheEvict(value = "categories-getAll", allEntries = true)
    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        log.info("Creating event category: {}", request.getName());

        // Business validation
        validateCategoryData(request);

        // Check for duplicate category name
        if (eventCategoryRepository.existsByName(request.getName().trim())) {
            log.error("Category already exists with name: {}", request.getName());
            throw new EventException("Category already exists with name: " + request.getName());
        }

        // Create category entity from request
        EventCategory category = new EventCategory();
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        category.setIconUrl(request.getIconUrl());

        // Save category
        EventCategory savedCategory = eventCategoryRepository.save(category);
        log.info("Event category created successfully with ID: {}", savedCategory.getId());

        return categoryMapper.toResponse(savedCategory);
    }

    /**
     * Retrieves a category by its unique ID.
     *
     * @param id the category ID
     * @return CategoryResponse containing category details
     * @throws EventException if category not found
     */
    public CategoryResponse getCategoryById(Long id) {
        log.debug("Fetching category with ID: {}", id);

        EventCategory category = eventCategoryRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Category not found with ID: {}", id);
                    return new EventException("Category not found with ID: " + id);
                });

        return categoryMapper.toResponse(category);
    }

    /**
     * Retrieves all event categories from the database.
     *
     * @return List of CategoryResponse containing all categories
     */

    @Cacheable(value = "categories-getAll")
    public List<CategoryResponse> getAllCategories() {
        log.debug("Fetching all event categories");

        return eventCategoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a category by its unique name.
     *
     * @param name the category name
     * @return CategoryResponse containing category details
     * @throws EventException if category not found
     */
    public CategoryResponse getCategoryByName(String name) {
        log.debug("Fetching category with name: {}", name);

        if (name == null || name.trim().isEmpty()) {
            throw new EventException("Category name cannot be empty");
        }

        EventCategory category = eventCategoryRepository.findByName(name.trim())
                .orElseThrow(() -> {
                    log.error("Category not found with name: {}", name);
                    return new EventException("Category not found with name: " + name);
                });

        return categoryMapper.toResponse(category);
    }

    /**
     * Updates an existing event category.
     * Only non-null fields in the request will be updated.
     * Category name must remain unique.
     *
     * @param id the category ID
     * @param request the UpdateCategoryRequest containing updated category details
     * @return CategoryResponse with the updated category data
     * @throws EventException if category not found, validation fails, or name already exists
     */
    @CacheEvict(value = "categories-getAll", allEntries = true)
    @Transactional
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        log.info("Updating category ID: {}", id);

        EventCategory category = eventCategoryRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Category not found with ID: {}", id);
                    return new EventException("Category not found with ID: " + id);
                });

        // If name is being updated, check for uniqueness
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            String newName = request.getName().trim();

            // Check if name already exists and belongs to a different category
            if (!category.getName().equals(newName) &&
                    eventCategoryRepository.existsByName(newName)) {
                log.error("Category already exists with name: {}", newName);
                throw new EventException("Category already exists with name: " + newName);
            }

            category.setName(newName);
        }

        // Update other fields if provided
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        if (request.getIconUrl() != null) {
            category.setIconUrl(request.getIconUrl());
        }

        // Save updated category
        EventCategory updatedCategory = eventCategoryRepository.save(category);
        log.info("Event category updated successfully: {}", updatedCategory.getId());

        return categoryMapper.toResponse(updatedCategory);
    }

    /**
     * Deletes an event category by its ID.
     *
     * @param id the category ID
     * @throws EventException if category not found
     */

    @CacheEvict(value = "categories-getAll", allEntries = true)
    @Transactional
    public void deleteCategory(Long id) {
        log.info("Deleting category ID: {}", id);

        EventCategory category = eventCategoryRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Category not found with ID: {}", id);
                    return new EventException("Category not found with ID: " + id);
                });

        eventCategoryRepository.delete(category);
        log.info("Event category deleted successfully: {}", id);
    }

    /**
     * Validates category data for creation.
     *
     * @param request the CreateCategoryRequest to validate
     * @throws EventException if validation fails
     */
    private void validateCategoryData(CreateCategoryRequest request) {
        // Validate required fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new EventException("Category name cannot be empty");
        }

        // Validate name length
        String name = request.getName().trim();
        if (name.length() < 2) {
            throw new EventException("Category name must be at least 2 characters");
        }

        if (name.length() > 50) {
            throw new EventException("Category name cannot exceed 50 characters");
        }

        // Validate description length if provided
        if (request.getDescription() != null && request.getDescription().length() > 500) {
            throw new EventException("Category description cannot exceed 500 characters");
        }

        // Validate icon URL length if provided
        if (request.getIconUrl() != null && request.getIconUrl().length() > 255) {
            throw new EventException("Category icon URL cannot exceed 255 characters");
        }

        log.debug("Category data validation passed for: {}", request.getName());
    }

    /**
     * Checks if a category exists by its ID.
     *
     * @param id the category ID
     * @return true if category exists, false otherwise
     */
    public boolean categoryExists(Long id) {
        return eventCategoryRepository.existsById(id);
    }

    /**
     * Checks if a category exists by its name.
     *
     * @param name the category name
     * @return true if category exists, false otherwise
     */
    public boolean categoryExistsByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return false;
        }
        return eventCategoryRepository.existsByName(name.trim());
    }

    /**
     * Gets total count of all categories.
     * Useful for pagination or statistics.
     *
     * @return total number of categories
     */
    public long getCategoryCount() {
        return eventCategoryRepository.count();
    }
}
