package com.example.demo.model;

import java.time.LocalDateTime;

public record WarmingUpMaster(
        Long id,
        String nameJa,
        String nameSanskrit,
        String category,
        String standingSubcategory,
        int displayOrder,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public String categoryLabel() {
        return AsanaClassification.toCategoryLabel(category);
    }

    public String standingSubcategoryLabel() {
        return AsanaClassification.toStandingSubcategoryLabel(standingSubcategory);
    }
}
