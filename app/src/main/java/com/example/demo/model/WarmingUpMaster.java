package com.example.demo.model;

import java.time.LocalDateTime;

public record WarmingUpMaster(
        Long id,
        String nameJa,
        String nameSanskrit,
        int displayOrder,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
