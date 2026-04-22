package com.example.demo.model;

import java.time.LocalDateTime;

public record SequenceWarmingUp(
        Long id,
        Long sequenceId,
        Long warmingUpMasterId,
        String customName,
        String displayName,
        String nameSanskrit,
        String category,
        String standingSubcategory,
        int sortOrder,
        String memo,
        boolean custom,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public String categoryLabel() {
        return AsanaClassification.toCategoryLabel(category);
    }

    public String standingSubcategoryLabel() {
        return AsanaClassification.toStandingSubcategoryLabel(standingSubcategory);
    }

    public String classificationLabel() {
        if (category == null || category.isBlank()) {
            return "";
        }
        if (standingSubcategory == null || standingSubcategory.isBlank()) {
            return categoryLabel();
        }
        return categoryLabel() + " / " + standingSubcategoryLabel();
    }
}
