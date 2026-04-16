package com.example.demo.model;

import java.time.LocalDateTime;

public record BreathingMaster(
        Long id,
        String name,
        String category,
        String description,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
