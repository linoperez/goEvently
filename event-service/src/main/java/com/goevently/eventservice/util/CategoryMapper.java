package com.goevently.eventservice.util;

import com.goevently.eventservice.dto.CategoryResponse;
import com.goevently.eventservice.entity.EventCategory;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponse toResponse(EventCategory category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
