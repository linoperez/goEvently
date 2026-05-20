package com.goevently.eventservice.controller;

import com.goevently.eventservice.dto.ApiResponse;
import com.goevently.eventservice.dto.CategoryResponse;
import com.goevently.eventservice.dto.CreateCategoryRequest;
import com.goevently.eventservice.dto.UpdateCategoryRequest;
import com.goevently.eventservice.service.EventCategoryService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for managing event categories.
 * Provides endpoints for creating, retrieving, updating, and deleting event categories.
 *
 * Base URL: /api/categories
 */
@RestController
@RequestMapping("/api/categories")
@Slf4j
public class EventCategoryController {

    private final EventCategoryService eventCategoryService;

    @Autowired
    public EventCategoryController(EventCategoryService eventCategoryService) {
        this.eventCategoryService = eventCategoryService;
    }

    /**
     * Create a new event category.
     * Only ADMIN role can create categories.
     *
     * POST /api/categories
     *
     * @param request the CreateCategoryRequest containing category details
     * @return ResponseEntity with ApiResponse containing created CategoryResponse
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request) {

        log.info("API Call: Creating category - {}", request.getName());

        CategoryResponse categoryResponse = eventCategoryService.createCategory(request);

        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .success(true)
                .message("Category created successfully")
                .data(categoryResponse)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieve all event categories.
     * Accessible to all authenticated users.
     *
     * GET /api/categories
     *
     * @return ResponseEntity with ApiResponse containing list of CategoryResponse
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {

        log.info("API Call: Fetching all categories");

        List<CategoryResponse> categories = eventCategoryService.getAllCategories();

        ApiResponse<List<CategoryResponse>> response = ApiResponse.<List<CategoryResponse>>builder()
                .success(true)
                .message("Categories retrieved successfully")
                .data(categories)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve a specific category by its ID.
     * Accessible to all authenticated users.
     *
     * GET /api/categories/{id}
     *
     * @param id the category ID
     * @return ResponseEntity with ApiResponse containing CategoryResponse
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {

        log.info("API Call: Fetching category with ID - {}", id);

        CategoryResponse categoryResponse = eventCategoryService.getCategoryById(id);

        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .success(true)
                .message("Category retrieved successfully")
                .data(categoryResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Retrieve a category by its name.
     * Accessible to all authenticated users.
     *
     * GET /api/categories/search/name?name=Music
     *
     * @param name the category name to search for
     * @return ResponseEntity with ApiResponse containing CategoryResponse
     */
    @GetMapping("/search/name")
    @PreAuthorize("hasAnyRole('USER', 'ORGANIZER', 'ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryByName(
            @RequestParam String name) {

        log.info("API Call: Fetching category by name - {}", name);

        CategoryResponse categoryResponse = eventCategoryService.getCategoryByName(name);

        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .success(true)
                .message("Category retrieved successfully")
                .data(categoryResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Update an existing event category.
     * Only ADMIN role can update categories.
     *
     * PUT /api/categories/{id}
     *
     * @param id the category ID
     * @param request the UpdateCategoryRequest containing updated category details
     * @return ResponseEntity with ApiResponse containing updated CategoryResponse
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {

        log.info("API Call: Updating category with ID - {}", id);

        CategoryResponse categoryResponse = eventCategoryService.updateCategory(id, request);

        ApiResponse<CategoryResponse> response = ApiResponse.<CategoryResponse>builder()
                .success(true)
                .message("Category updated successfully")
                .data(categoryResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Delete an event category.
     * Only ADMIN role can delete categories.
     *
     * DELETE /api/categories/{id}
     *
     * @param id the category ID
     * @return ResponseEntity with ApiResponse containing success message
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {

        log.info("API Call: Deleting category with ID - {}", id);

        eventCategoryService.deleteCategory(id);

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(true)
                .message("Category deleted successfully")
                .build();

        return ResponseEntity.ok(response);
    }
}
